// ADR: ADR-007-workflow-orchestration

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { exec as childExec } from "node:child_process";
import { promisify } from "node:util";
import { TaskManager } from "../tasks/task-manager.js";
import type { Chain, Task, TransitionResult } from "../tasks/types.js";
import type {
  StageType,
  TransitionAction,
  WorkflowStage,
  PostMessageAction,
  EmitEventAction,
  SpawnAgentAction,
  TaskHookName,
  ChainHookName,
} from "./types.js";
import type { CommandResult, CommandRunner } from "./manager.js";
import { runChainCompletionGate } from "../chain/completion-gate.js";

const exec = promisify(childExec);

export type CustomActionHandler = (action: TransitionAction, context: TransitionHookContext) => Promise<unknown> | unknown;

export interface TransitionHookContext {
  workflowId: string;
  stageIndex: number;
  chainId?: string;
  taskId?: string;
}

export interface HookActionResultDetails {
  command?: CommandResult;
  taskTransition?: TransitionResult;
  fileMove?: { from: string; to: string };
  custom?: unknown;
  postMessage?: {
    target: string;
    content: string;
    metadata?: Record<string, unknown>;
    result?: unknown;
  };
  emitEvent?: {
    eventType: string;
    payload?: Record<string, unknown>;
    result?: unknown;
  };
  spawnAgent?: {
    role: string;
    context?: Record<string, unknown>;
    sessionId?: string;
    result?: unknown;
  };
  validation?: {
    chainId: string;
    result: import("../chain/validation-types.js").ChainCompletionGateResult;
  };
}

export interface HookActionResult {
  action: TransitionAction;
  success: boolean;
  blocking: boolean;
  error?: string;
  details?: HookActionResultDetails;
}

export type HookName = "onEnter" | "onExit" | TaskHookName | ChainHookName;

export interface HookRunResult {
  hook: HookName;
  stageName?: string;
  stageType?: StageType;
  stageIndex?: number;
  chainId?: string;
  taskId?: string;
  results: HookActionResult[];
}

export class HookExecutionError extends Error {
  result: HookRunResult;

  constructor(message: string, result: HookRunResult) {
    super(message);
    this.name = "HookExecutionError";
    this.result = result;
  }
}

export interface TransitionHookRunnerOptions {
  commandRunner?: CommandRunner;
  taskManager?: TaskManager;
  customHandlers?: Record<string, CustomActionHandler>;
  fileMover?: (from: string, to: string) => Promise<void>;
  messagePoster?: MessagePoster;
  eventEmitter?: EventEmitter;
  agentSpawner?: AgentSpawner;
  logger?: (result: HookRunResult) => void;
}

export type MessagePoster = (
  message: Pick<PostMessageAction, "target" | "content" | "metadata">,
  context: TransitionHookContext
) => Promise<unknown> | unknown;

export type EventEmitter = (
  event: Pick<EmitEventAction, "eventType" | "payload">,
  context: TransitionHookContext
) => Promise<unknown> | unknown;

export type AgentSpawner = (
  action: Pick<SpawnAgentAction, "role" | "context">,
  context: TransitionHookContext
) => Promise<{ sessionId: string } | { sessionId?: string } | unknown>;

export function interpolateTemplate(template: string, context: TransitionHookContext): string {
  const lookup: Record<string, string | undefined> = {
    workflowId: context.workflowId,
    stageIndex: String(context.stageIndex),
    chainId: context.chainId,
    taskId: context.taskId,
  };

  return template.replace(/{{\s*(\w+)\s*}}/g, (match, key) => {
    const value = lookup[key];
    return value !== undefined ? value : match;
  });
}

function interpolateValue<T>(value: T, context: TransitionHookContext): T {
  if (typeof value === "string") {
    return interpolateTemplate(value, context) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => interpolateValue(item, context)) as T;
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      result[key] = interpolateValue(entry, context);
    }
    return result as T;
  }
  return value;
}

function interpolateAction(action: TransitionAction, context: TransitionHookContext): TransitionAction {
  return interpolateValue(action, context);
}

/**
 * Executes stage transition hooks (onEnter/onExit) with support for command,
 * task transition, file move, and custom actions.
 */
export class TransitionHookRunner {
  private projectRoot: string;
  private commandRunner: CommandRunner;
  private taskManager?: TaskManager;
  private customHandlers: Record<string, CustomActionHandler>;
  private fileMover: (from: string, to: string) => Promise<void>;
  private messagePoster?: MessagePoster;
  private eventEmitter?: EventEmitter;
  private agentSpawner?: AgentSpawner;
  private logger?: (result: HookRunResult) => void;

  constructor(projectRoot: string, options: TransitionHookRunnerOptions = {}) {
    this.projectRoot = projectRoot;
    this.commandRunner = options.commandRunner ?? this.defaultCommandRunner.bind(this);
    this.taskManager = options.taskManager;
    this.customHandlers = options.customHandlers ?? {};
    this.fileMover = options.fileMover ?? fs.rename;
    this.messagePoster = options.messagePoster;
    this.eventEmitter = options.eventEmitter;
    this.agentSpawner = options.agentSpawner;
    this.logger = options.logger;
  }

  async runOnEnter(stage: WorkflowStage, context: TransitionHookContext): Promise<HookRunResult> {
    return this.runHook("onEnter", stage, context);
  }

  async runOnExit(stage: WorkflowStage, context: TransitionHookContext): Promise<HookRunResult> {
    return this.runHook("onExit", stage, context);
  }

  async runTaskHook(hookName: TaskHookName, task: Task, context: TransitionHookContext): Promise<HookRunResult> {
    const hookActions = task.hooks?.[hookName] ?? [];
    const hookContext: TransitionHookContext = {
      ...context,
      chainId: context.chainId ?? task.chainId,
      taskId: context.taskId ?? task.id,
    };
    return this.runHookActions(hookName, hookActions, hookContext, { task });
  }

  async runChainHook(hookName: ChainHookName, chain: Chain, context: TransitionHookContext): Promise<HookRunResult> {
    const hookActions = chain.hooks?.[hookName] ?? [];
    const hookContext: TransitionHookContext = { ...context, chainId: context.chainId ?? chain.id };
    return this.runHookActions(hookName, hookActions, hookContext, { chain });
  }

  private async runHook(
    hookName: "onEnter" | "onExit",
    stage: WorkflowStage,
    context: TransitionHookContext
  ): Promise<HookRunResult> {
    const actions = stage.hooks?.[hookName] ?? [];
    return this.runHookActions(hookName, actions, context, { stage });
  }

  private async runHookActions(
    hookName: HookName,
    actions: TransitionAction[],
    context: TransitionHookContext,
    meta: { stage?: WorkflowStage; task?: Task; chain?: Chain }
  ): Promise<HookRunResult> {
    const results: HookActionResult[] = [];

    for (const action of actions) {
      const result = await this.runAction(interpolateAction(action, context), meta.stage, context);
      results.push(result);

      if (result.blocking && !result.success) {
        const runResult: HookRunResult = {
          hook: hookName,
          stageName: meta.stage?.name,
          stageType: meta.stage?.type,
          stageIndex: context.stageIndex,
          chainId: meta.stage?.chainId ?? meta.chain?.id ?? context.chainId,
          taskId: meta.task?.id ?? context.taskId,
          results,
        };
        this.log(runResult);
        const subject = meta.stage?.name ?? meta.task?.id ?? meta.chain?.id ?? "hook target";
        throw new HookExecutionError(`Hook ${hookName} failed for ${subject}: ${result.error ?? "unknown error"}`, runResult);
      }
    }

    const runResult: HookRunResult = {
      hook: hookName,
      stageName: meta.stage?.name,
      stageType: meta.stage?.type,
      stageIndex: context.stageIndex,
      chainId: meta.stage?.chainId ?? meta.chain?.id ?? context.chainId,
      taskId: meta.task?.id ?? context.taskId,
      results,
    };
    this.log(runResult);
    return runResult;
  }

  private async runAction(
    action: TransitionAction,
    stage: WorkflowStage | undefined,
    context: TransitionHookContext
  ): Promise<HookActionResult> {
    const blocking = action.blocking !== false;

    try {
      if (action.type === "command") {
        if (!action.command) {
          return { action, blocking, success: false, error: "Command action requires command text" };
        }

        const result = await this.commandRunner(action.command);
        const success = result.exitCode === 0;
        return {
          action,
          blocking,
          success,
          error: success ? undefined : `Command failed with exit code ${result.exitCode}`,
          details: { command: result },
        };
      }

      if (action.type === "task_transition") {
        const chainId = context.chainId ?? stage?.chainId;
        const taskId = context.taskId;
        if (!chainId) {
          return { action, blocking, success: false, error: "Task transition requires chainId in context or stage" };
        }
        if (!taskId) {
          return { action, blocking, success: false, error: "Task transition requires taskId in context" };
        }

        const manager = this.taskManager ?? (this.taskManager = new TaskManager(this.projectRoot));
        let transition: TransitionResult | null = null;

        if (action.taskTransition === "start") {
          transition = await manager.startTask(chainId, taskId);
        } else if (action.taskTransition === "complete") {
          transition = await manager.completeTask(chainId, taskId);
        } else if (action.taskTransition === "approve") {
          transition = await manager.approveTask(chainId, taskId);
        } else {
          return { action, blocking, success: false, error: "Unsupported task transition" };
        }

        return {
          action,
          blocking,
          success: transition.success,
          error: transition.success ? undefined : transition.error ?? "Task transition failed",
          details: { taskTransition: transition },
        };
      }

      if (action.type === "file_move") {
        const move = action.fileMove;
        if (!move?.from || !move.to) {
          return { action, blocking, success: false, error: "File move requires from and to paths" };
        }

        const fromPath = path.resolve(this.projectRoot, move.from);
        const toPath = path.resolve(this.projectRoot, move.to);
        await fs.mkdir(path.dirname(toPath), { recursive: true });
        await this.fileMover(fromPath, toPath);

        return {
          action,
          blocking,
          success: true,
          details: { fileMove: { from: fromPath, to: toPath } },
        };
      }

      if (action.type === "post_message") {
        if (!this.messagePoster) {
          return { action, blocking, success: false, error: "Message poster is not configured" };
        }
        if (!action.target) {
          return { action, blocking, success: false, error: "Post message requires a target" };
        }
        if (!action.content) {
          return { action, blocking, success: false, error: "Post message requires content" };
        }

        const result = await this.messagePoster(
          { target: action.target, content: action.content, metadata: action.metadata },
          context
        );

        return {
          action,
          blocking,
          success: true,
          details: { postMessage: { target: action.target, content: action.content, metadata: action.metadata, result } },
        };
      }

      if (action.type === "emit_event") {
        if (!this.eventEmitter) {
          return { action, blocking, success: false, error: "Event emitter is not configured" };
        }
        if (!action.eventType) {
          return { action, blocking, success: false, error: "Emit event requires eventType" };
        }

        const result = await this.eventEmitter(
          { eventType: action.eventType, payload: action.payload },
          context
        );

        return {
          action,
          blocking,
          success: true,
          details: { emitEvent: { eventType: action.eventType, payload: action.payload, result } },
        };
      }

      if (action.type === "spawn_agent") {
        if (!this.agentSpawner) {
          return { action, blocking, success: false, error: "Agent spawner is not configured" };
        }
        if (!action.role) {
          return { action, blocking, success: false, error: "Spawn agent requires role" };
        }

        const result = await this.agentSpawner({ role: action.role, context: action.context }, context);
        const sessionId = typeof result === "object" && result !== null && "sessionId" in result ? (result as { sessionId?: string }).sessionId : undefined;

        return {
          action,
          blocking,
          success: true,
          details: { spawnAgent: { role: action.role, context: action.context, sessionId, result } },
        };
      }

      if (action.type === "custom") {
        if (!action.handler) {
          return { action, blocking, success: false, error: "Custom action requires a handler" };
        }
        const handler = this.customHandlers[action.handler];
        if (!handler) {
          return { action, blocking, success: false, error: `Custom handler not found: ${action.handler}` };
        }

        const result = await handler(action, context);
        return { action, blocking, success: true, details: { custom: result } };
      }

      if (action.type === "validation") {
        const chainId = action.chainId ?? context.chainId;
        if (!chainId) {
          return { action, blocking, success: false, error: "Validation action requires chainId" };
        }

        const validationResult = await runChainCompletionGate({
          projectRoot: this.projectRoot,
          chainId,
          chain: undefined,
          taskConfig: action.taskConfig,
          modifiedFiles: action.modifiedFiles,
          designDocGlobs: action.designDocGlobs,
          testFileGlobs: action.testFileGlobs,
          defaultChecks: action.config?.defaultChecks,
          chainOverrides: action.config?.chainOverrides,
          requiredChecks: action.config?.requiredChecks,
        });

        const success = validationResult.valid;
        const error = success
          ? undefined
          : validationResult.failedChecks && validationResult.failedChecks.length > 0
            ? `Validation failed: ${validationResult.failedChecks.join(", ")}`
            : "Validation failed";

        return {
          action,
          blocking,
          success,
          error,
          details: { validation: { chainId, result: validationResult } },
        };
      }

      return { action, blocking, success: false, error: `Unsupported action type ${(action as TransitionAction).type}` };
    } catch (error) {
      return {
        action,
        blocking,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
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

  private log(result: HookRunResult): void {
    if (!this.logger) return;
    this.logger(result);
  }
}
