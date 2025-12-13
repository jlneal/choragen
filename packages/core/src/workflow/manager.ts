/**
 * Workflow lifecycle management
 *
 * Handles CRUD operations, gate satisfaction, advancement, and persistence.
 *
 * ADR: ADR-011-workflow-orchestration
 * Design: docs/design/core/features/workflow-orchestration.md
 */

import { randomUUID } from "node:crypto";
import { exec as childExec } from "node:child_process";
import { promisify } from "node:util";
import type { TaskStatus } from "../tasks/types.js";
import { ChainManager } from "../tasks/chain-manager.js";
import type {
  Workflow,
  WorkflowStage,
  StageGate,
  WorkflowStatus,
  WorkflowMessage,
  WorkflowMessageMetadata,
  MessageRole,
} from "./types.js";
import type { WorkflowTemplate, WorkflowTemplateStage } from "./templates.js";
import { TransitionHookRunner, HookExecutionError } from "./hook-runner.js";
import type { HookRunResult, TransitionHookContext } from "./hook-runner.js";
import { FeedbackManager } from "../feedback/FeedbackManager.js";
import {
  ensureWorkflowDirs,
  loadWorkflow,
  loadWorkflowIndex,
  saveWorkflow,
  saveWorkflowIndex,
  type WorkflowIndex,
} from "./persistence.js";
export type { WorkflowTemplate, WorkflowTemplateStage } from "./templates.js";

const exec = promisify(childExec);

export interface CreateWorkflowOptions {
  requestId: string;
  template: WorkflowTemplate;
}

export interface ListWorkflowsOptions {
  status?: WorkflowStatus;
  requestId?: string;
  template?: string;
}

export interface AddMessageOptions {
  role: MessageRole;
  content: string;
  stageIndex: number;
  metadata?: WorkflowMessageMetadata;
}

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export type CommandRunner = (command: string) => Promise<CommandResult>;
export type ChainStatusChecker = (chainId: string) => Promise<TaskStatus | null>;

export class WorkflowManager {
  private projectRoot: string;
  private commandRunner: CommandRunner;
  private chainStatusChecker: ChainStatusChecker;
  private chainManager?: ChainManager;
  private hookRunner?: TransitionHookRunner;
  private feedbackManager?: FeedbackManager;

  constructor(
    projectRoot: string,
    options: { commandRunner?: CommandRunner; chainStatusChecker?: ChainStatusChecker; hookRunner?: TransitionHookRunner } = {}
  ) {
    this.projectRoot = projectRoot;
    this.commandRunner = options.commandRunner ?? this.defaultCommandRunner.bind(this);
    this.chainStatusChecker = options.chainStatusChecker ?? this.defaultChainStatusChecker.bind(this);
    this.hookRunner = options.hookRunner;
    this.feedbackManager = new FeedbackManager(this.projectRoot);
  }

  /**
   * Create a workflow from a template
   */
  async create(options: CreateWorkflowOptions): Promise<Workflow> {
    const now = new Date();
    const index = await loadWorkflowIndex(this.projectRoot);
    const { id, index: updatedIndex } = this.generateWorkflowId(index, now);

    const stages = options.template.stages.map((stageDef, idx) => {
      const status = idx === 0 ? "active" : "pending";
      const gate = this.initializeGate(stageDef.gate);
      const stage: WorkflowStage = {
        name: stageDef.name,
        type: stageDef.type,
        status,
        chainId: stageDef.chainId,
        sessionId: stageDef.sessionId,
        gate,
        hooks: stageDef.hooks,
        startedAt: status === "active" ? now : undefined,
      };

      if (stage.gate.type === "auto" && !stage.gate.satisfied) {
        this.markGateSatisfied(stage, "system");
      }

      return stage;
    });

    const workflow: Workflow = {
      id,
      requestId: options.requestId,
      template: options.template.name,
      currentStage: 0,
      status: "active",
      stages,
      messages: [],
      createdAt: now,
      updatedAt: now,
      blockingFeedbackIds: [],
    };

    this.addGatePromptIfNeeded(workflow, workflow.currentStage);
    await this.persistWorkflow(workflow, updatedIndex);
    return workflow;
  }

  /**
   * Retrieve a workflow by ID
   */
  async get(workflowId: string): Promise<Workflow | null> {
    return loadWorkflow(this.projectRoot, workflowId);
  }

  /**
   * List workflows with optional filters
   */
  async list(options: ListWorkflowsOptions = {}): Promise<Workflow[]> {
    const index = await loadWorkflowIndex(this.projectRoot);
    const entries = Object.values(index.workflows).filter((entry) => {
      if (options.status && entry.status !== options.status) return false;
      if (options.requestId && entry.requestId !== options.requestId) return false;
      if (options.template && entry.template !== options.template) return false;
      return true;
    });

    const workflows: Workflow[] = [];
    for (const entry of entries) {
      const workflow = await loadWorkflow(this.projectRoot, entry.id);
      if (workflow) workflows.push(workflow);
    }
    return workflows;
  }

  /**
   * Advance the workflow to the next stage, validating gate satisfaction
   */
  async advance(workflowId: string): Promise<Workflow> {
    let workflow = await this.requireWorkflow(workflowId);
    if (workflow.status === "completed" || workflow.status === "cancelled" || workflow.status === "discarded") {
      throw new Error(`Workflow ${workflowId} is not active`);
    }

    const stage = workflow.stages[workflow.currentStage];
    await this.ensureNoBlockingFeedback(workflow);
    await this.ensureGateSatisfied(workflow, stage);

    const hookRunner = this.getHookRunner();
    await this.runHookAndRecord(
      "onExit",
      hookRunner,
      workflow,
      stage,
      {
        workflowId: workflow.id,
        stageIndex: workflow.currentStage,
        chainId: stage.chainId,
      }
    );

    stage.status = "completed";
    stage.completedAt = new Date();

    workflow.currentStage += 1;

    if (workflow.currentStage >= workflow.stages.length) {
      workflow.status = "completed";
    } else {
      const nextStage = workflow.stages[workflow.currentStage];
      nextStage.status = "active";
      nextStage.startedAt = new Date();
      if (nextStage.gate.type === "auto" && !nextStage.gate.satisfied) {
        this.markGateSatisfied(nextStage, "system");
      }
      await this.runHookAndRecord(
        "onEnter",
        hookRunner,
        workflow,
        nextStage,
        {
          workflowId: workflow.id,
          stageIndex: workflow.currentStage,
          chainId: nextStage.chainId,
        }
      );
      this.addGatePromptIfNeeded(workflow, workflow.currentStage);
    }

    workflow.updatedAt = new Date();
    await this.persistWorkflow(workflow);
    return workflow;
  }

  /**
   * Mark a gate as satisfied for the current stage
   */
  async satisfyGate(workflowId: string, stageIndex: number, satisfiedBy: string): Promise<Workflow> {
    const workflow = await this.requireWorkflow(workflowId);
    if (stageIndex !== workflow.currentStage) {
      throw new Error(`Gate satisfaction is only allowed for current stage ${workflow.currentStage}`);
    }

    const stage = workflow.stages[stageIndex];
    this.markGateSatisfied(stage, satisfiedBy);

    workflow.updatedAt = new Date();
    await this.persistWorkflow(workflow);
    return workflow;
  }

  /**
   * Trigger the prompt for an agent-triggered human approval gate on the current stage.
   */
  async triggerGatePrompt(workflowId: string): Promise<Workflow> {
    const workflow = await this.requireWorkflow(workflowId);
    const stage = workflow.stages[workflow.currentStage];

    if (!stage) {
      throw new Error(`Stage ${workflow.currentStage} not found for workflow ${workflowId}`);
    }

    if (stage.gate.type !== "human_approval" || !stage.gate.agentTriggered) {
      throw new Error("Current stage does not have an agent-triggered human approval gate");
    }

    this.addGatePromptIfNeeded(workflow, workflow.currentStage, { force: true });
    workflow.updatedAt = new Date();
    await this.persistWorkflow(workflow);
    return workflow;
  }

  /**
   * Append a message to the workflow history
   */
  async addMessage(workflowId: string, options: AddMessageOptions): Promise<Workflow> {
    const workflow = await this.requireWorkflow(workflowId);
    if (!workflow.stages[options.stageIndex]) {
      throw new Error(`Stage ${options.stageIndex} does not exist on workflow ${workflowId}`);
    }

    const message: WorkflowMessage = {
      id: randomUUID(),
      role: options.role,
      content: options.content,
      stageIndex: options.stageIndex,
      timestamp: new Date(),
      metadata: options.metadata,
    };

    workflow.messages.push(message);
    workflow.updatedAt = new Date();
    await this.persistWorkflow(workflow);
    return workflow;
  }

  /**
   * Update overall workflow status (e.g., pause, cancel)
   */
  async updateStatus(workflowId: string, status: WorkflowStatus): Promise<Workflow> {
    const workflow = await this.requireWorkflow(workflowId);
    workflow.status = status;
    workflow.updatedAt = new Date();
    await this.persistWorkflow(workflow);
    return workflow;
  }

  /**
   * Discard a workflow with a provided reason, recording the decision in history.
   */
  async discard(workflowId: string, reason: string): Promise<Workflow> {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      throw new Error("Discard reason is required");
    }

    const workflow = await this.requireWorkflow(workflowId);
    const message: WorkflowMessage = {
      id: randomUUID(),
      role: "system",
      content: trimmedReason,
      stageIndex: workflow.currentStage,
      timestamp: new Date(),
      metadata: {
        type: "discard_reason",
      },
    };

    workflow.messages.push(message);
    workflow.status = "discarded";
    workflow.updatedAt = new Date();
    await this.persistWorkflow(workflow);
    return workflow;
  }

  private async runHookAndRecord(
    hookName: "onEnter" | "onExit",
    hookRunner: TransitionHookRunner,
    workflow: Workflow,
    stage: WorkflowStage,
    context: TransitionHookContext
  ): Promise<HookRunResult | null> {
    const actions = stage.hooks?.[hookName];
    if (!actions || actions.length === 0) return null;

    try {
      const result = hookName === "onEnter" ? await hookRunner.runOnEnter(stage, context) : await hookRunner.runOnExit(stage, context);
      this.recordHookResults(workflow, result);
      return result;
    } catch (error) {
      if (error instanceof HookExecutionError) {
        this.recordHookResults(workflow, error.result);
      }
      throw error;
    }
  }

  private recordHookResults(workflow: Workflow, result: HookRunResult): void {
    if (!result.results.length) return;

    const summary = result.results
      .map((actionResult) => `${actionResult.action.type}:${actionResult.success ? "ok" : "fail"}`)
      .join(", ");

    const stageLabel = result.stageName ?? result.chainId ?? result.taskId ?? "unknown";
    const stageIndex = result.stageIndex ?? 0;
    const message: WorkflowMessage = {
      id: randomUUID(),
      role: "system",
      content: `Hook ${result.hook} for ${stageLabel}: ${summary}`,
      stageIndex,
      metadata: {
        type: "hook_results",
        hook: result.hook,
        stageName: result.stageName,
        chainId: result.chainId,
        taskId: result.taskId,
        results: result.results,
      },
      timestamp: new Date(),
    };

    workflow.messages.push(message);
  }

  private getHookRunner(): TransitionHookRunner {
    if (!this.hookRunner) {
      this.hookRunner = new TransitionHookRunner(this.projectRoot, { commandRunner: this.commandRunner });
    }
    return this.hookRunner;
  }

  private getFeedbackManager(): FeedbackManager {
    if (!this.feedbackManager) {
      this.feedbackManager = new FeedbackManager(this.projectRoot);
    }
    return this.feedbackManager;
  }

  private async ensureNoBlockingFeedback(workflow: Workflow): Promise<void> {
    const manager = this.getFeedbackManager();
    const blockers = await manager.list({
      workflowId: workflow.id,
      type: "blocker",
    });
    const unresolved = blockers.filter(
      (feedback) => feedback.status === "pending" || feedback.status === "acknowledged"
    );

    workflow.blockingFeedbackIds = unresolved.map((feedback) => feedback.id);

    if (unresolved.length > 0) {
      workflow.updatedAt = new Date();
      await this.persistWorkflow(workflow);
      const blockerList = unresolved.map((item) => item.id).join(", ");
      throw new Error(`Workflow ${workflow.id} has unresolved blockers: ${blockerList}`);
    }
  }

  private initializeGate(gate: WorkflowTemplateStage["gate"]): StageGate {
    return {
      ...gate,
      satisfied: gate.satisfied ?? false,
      satisfiedBy: gate.satisfiedBy,
      satisfiedAt: gate.satisfiedAt ? new Date(gate.satisfiedAt) : undefined,
    };
  }

  private markGateSatisfied(stage: WorkflowStage, satisfiedBy: string): void {
    stage.gate.satisfied = true;
    stage.gate.satisfiedBy = satisfiedBy;
    stage.gate.satisfiedAt = new Date();
    if (stage.status === "active") {
      stage.status = "awaiting_gate";
    }
  }

  private async ensureGateSatisfied(workflow: Workflow, stage: WorkflowStage): Promise<void> {
    if (stage.gate.satisfied) return;

    switch (stage.gate.type) {
      case "auto": {
        this.markGateSatisfied(stage, "system");
        return;
      }
      case "human_approval": {
        throw new Error("Gate not satisfied");
      }
      case "chain_complete": {
        if (!stage.gate.chainId) {
          throw new Error("chain_complete gate requires chainId");
        }
        const status = await this.chainStatusChecker(stage.gate.chainId);
        if (status === "done") {
          this.markGateSatisfied(stage, "system");
          return;
        }
        throw new Error(`Chain ${stage.gate.chainId} not complete`);
      }
      case "verification_pass": {
        const commands = stage.gate.commands || [];
        if (commands.length === 0) {
          throw new Error("verification_pass gate requires at least one command");
        }
        for (const command of commands) {
          const result = await this.commandRunner(command);
          if (result.exitCode !== 0) {
            throw new Error(`Verification command failed: ${command}`);
          }
        }
        this.markGateSatisfied(stage, "system");
        return;
      }
      default: {
        const gateType: never = stage.gate.type;
        throw new Error(`Unsupported gate type: ${gateType}`);
      }
    }
  }

  private async requireWorkflow(workflowId: string): Promise<Workflow> {
    const workflow = await this.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }
    return workflow;
  }

  private async persistWorkflow(workflow: Workflow, index?: WorkflowIndex): Promise<void> {
    const workflowIndex = index ?? (await loadWorkflowIndex(this.projectRoot));
    workflowIndex.workflows[workflow.id] = {
      id: workflow.id,
      requestId: workflow.requestId,
      status: workflow.status,
      template: workflow.template,
      currentStage: workflow.currentStage,
      updatedAt: workflow.updatedAt.toISOString(),
    };

    await ensureWorkflowDirs(this.projectRoot);
    await saveWorkflow(this.projectRoot, workflow);
    await saveWorkflowIndex(this.projectRoot, workflowIndex);
  }

  private generateWorkflowId(index: WorkflowIndex, now: Date): { id: string; index: WorkflowIndex } {
    const datePart = formatDate(now);
    const nextSequence = index.lastDate === datePart ? index.lastSequence + 1 : 1;
    const workflowId = `WF-${datePart}-${formatSequence(nextSequence)}`;

    return {
      id: workflowId,
      index: {
        ...index,
        lastDate: datePart,
        lastSequence: nextSequence,
      },
    };
  }

  private async defaultChainStatusChecker(chainId: string): Promise<TaskStatus | null> {
    if (!this.chainManager) {
      this.chainManager = new ChainManager(this.projectRoot);
    }
    const chain = await this.chainManager.getChain(chainId);
    if (!chain) return null;
    return this.chainManager.getChainStatus(chain);
  }

  private async defaultCommandRunner(command: string): Promise<CommandResult> {
    try {
      const { stdout, stderr } = await exec(command, { cwd: this.projectRoot });
      return { exitCode: 0, stdout, stderr };
    } catch (error: unknown) {
      if (error && typeof error === "object" && "code" in error) {
        const execError = error as { code?: number; stdout?: string; stderr?: string };
        return {
          exitCode: typeof execError.code === "number" ? execError.code : 1,
          stdout: execError.stdout ?? "",
          stderr: execError.stderr ?? "",
        };
      }
      return { exitCode: 1, stdout: "", stderr: String(error) };
    }
  }

  private addGatePromptIfNeeded(
    workflow: Workflow,
    stageIndex: number,
    options: { force?: boolean } = {}
  ): void {
    const stage = workflow.stages[stageIndex];
    if (!stage || stage.gate.type !== "human_approval") return;
    if (stage.gate.agentTriggered && !options.force) return;
    if (stage.gate.satisfied) return;

    const prompt = stage.gate.prompt ?? "Approval required to proceed.";
    const message: WorkflowMessage = {
      id: randomUUID(),
      role: "system",
      content: `Approval Required: ${prompt}`,
      stageIndex,
      metadata: {
        type: "gate_prompt",
        gateType: stage.gate.type,
        prompt,
      },
      timestamp: new Date(),
    };

    workflow.messages.push(message);
    workflow.updatedAt = new Date();
  }
}

function formatSequence(seq: number): string {
  return seq.toString().padStart(3, "0");
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}${month}${day}`;
}
