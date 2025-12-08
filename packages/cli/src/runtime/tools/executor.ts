// ADR: ADR-010-agent-runtime-architecture

/**
 * Tool execution dispatcher and types.
 * Dispatches tool calls to the appropriate executor based on tool name.
 */

import type { AgentRole } from "./types.js";

/**
 * Result of a tool execution.
 */
export interface ToolResult {
  /** Whether the execution succeeded */
  success: boolean;
  /** Result data (if successful) */
  data?: unknown;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Context provided to tool executors.
 */
export interface ExecutionContext {
  /** Role of the agent executing the tool */
  role: AgentRole;
  /** Current chain ID (if in a chain context) */
  chainId?: string;
  /** Current task ID (if in a task context) */
  taskId?: string;
  /** Workspace root directory */
  workspaceRoot: string;
}

/**
 * Function signature for tool executors.
 */
export type ToolExecutorFn = (
  params: Record<string, unknown>,
  context: ExecutionContext
) => Promise<ToolResult>;

/**
 * Tool definition with an execute function.
 */
export interface ExecutableTool {
  name: string;
  execute: ToolExecutorFn;
}

// Import executors from tool definitions
import { executeChainStatus } from "./definitions/chain-status.js";
import { executeTaskStatus } from "./definitions/task-status.js";
import { executeTaskList } from "./definitions/task-list.js";
import { executeTaskStart } from "./definitions/task-start.js";
import { executeTaskComplete } from "./definitions/task-complete.js";
import { executeTaskApprove } from "./definitions/task-approve.js";
import { executeSpawnImplSession } from "./definitions/spawn-impl-session.js";

/**
 * Map of tool names to their executor functions.
 */
const TOOL_EXECUTORS: Map<string, ToolExecutorFn> = new Map([
  ["chain:status", executeChainStatus],
  ["task:status", executeTaskStatus],
  ["task:list", executeTaskList],
  ["task:start", executeTaskStart],
  ["task:complete", executeTaskComplete],
  ["task:approve", executeTaskApprove],
  ["spawn_impl_session", executeSpawnImplSession],
]);

/**
 * Tool execution dispatcher.
 * Routes tool calls to the appropriate executor.
 */
export class ToolExecutor {
  private executors: Map<string, ToolExecutorFn>;

  constructor(executors: Map<string, ToolExecutorFn> = TOOL_EXECUTORS) {
    this.executors = new Map(executors);
  }

  /**
   * Execute a tool by name.
   * @param toolName - Name of the tool to execute
   * @param params - Parameters to pass to the tool
   * @param context - Execution context
   * @returns Tool execution result
   */
  async execute(
    toolName: string,
    params: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<ToolResult> {
    const executor = this.executors.get(toolName);

    if (!executor) {
      return {
        success: false,
        error: `Unknown tool: ${toolName}`,
      };
    }

    try {
      return await executor(params, context);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `Tool execution failed: ${message}`,
      };
    }
  }

  /**
   * Check if a tool executor is registered.
   * @param toolName - Name of the tool
   * @returns True if the tool has an executor
   */
  hasExecutor(toolName: string): boolean {
    return this.executors.has(toolName);
  }

  /**
   * Register a custom tool executor.
   * @param toolName - Name of the tool
   * @param executor - Executor function
   */
  registerExecutor(toolName: string, executor: ToolExecutorFn): void {
    this.executors.set(toolName, executor);
  }

  /**
   * Get all registered tool names.
   */
  getRegisteredTools(): string[] {
    return Array.from(this.executors.keys());
  }
}

/**
 * Default tool executor instance with all Phase 1 executors.
 */
export const defaultExecutor = new ToolExecutor();
