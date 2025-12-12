// ADR: ADR-007-workflow-orchestration

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { exec as childExec } from "node:child_process";
import { promisify } from "node:util";
import { TaskManager } from "../tasks/task-manager.js";
import type { TransitionResult } from "../tasks/types.js";
import type { StageType, TransitionAction, WorkflowStage } from "./types.js";
import type { CommandResult, CommandRunner } from "./manager.js";

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
}

export interface HookActionResult {
  action: TransitionAction;
  success: boolean;
  blocking: boolean;
  error?: string;
  details?: HookActionResultDetails;
}

export interface HookRunResult {
  hook: "onEnter" | "onExit";
  stageName: string;
  stageType: StageType;
  stageIndex: number;
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
  logger?: (result: HookRunResult) => void;
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
  private logger?: (result: HookRunResult) => void;

  constructor(projectRoot: string, options: TransitionHookRunnerOptions = {}) {
    this.projectRoot = projectRoot;
    this.commandRunner = options.commandRunner ?? this.defaultCommandRunner.bind(this);
    this.taskManager = options.taskManager;
    this.customHandlers = options.customHandlers ?? {};
    this.fileMover = options.fileMover ?? fs.rename;
    this.logger = options.logger;
  }

  async runOnEnter(stage: WorkflowStage, context: TransitionHookContext): Promise<HookRunResult> {
    return this.runHook("onEnter", stage, context);
  }

  async runOnExit(stage: WorkflowStage, context: TransitionHookContext): Promise<HookRunResult> {
    return this.runHook("onExit", stage, context);
  }

  private async runHook(
    hookName: "onEnter" | "onExit",
    stage: WorkflowStage,
    context: TransitionHookContext
  ): Promise<HookRunResult> {
    const actions = stage.hooks?.[hookName] ?? [];
    const results: HookActionResult[] = [];

    for (const action of actions) {
      const result = await this.runAction(action, stage, context);
      results.push(result);

      if (result.blocking && !result.success) {
        const runResult: HookRunResult = {
          hook: hookName,
          stageName: stage.name,
          stageType: stage.type,
          stageIndex: context.stageIndex,
          results,
        };
        this.log(runResult);
        throw new HookExecutionError(`Hook ${hookName} failed for stage ${stage.name}: ${result.error ?? "unknown error"}`, runResult);
      }
    }

    const runResult: HookRunResult = {
      hook: hookName,
      stageName: stage.name,
      stageType: stage.type,
      stageIndex: context.stageIndex,
      results,
    };
    this.log(runResult);
    return runResult;
  }

  private async runAction(action: TransitionAction, stage: WorkflowStage, context: TransitionHookContext): Promise<HookActionResult> {
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
        const chainId = context.chainId ?? stage.chainId;
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
