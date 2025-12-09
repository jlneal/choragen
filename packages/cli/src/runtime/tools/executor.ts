// ADR: ADR-010-agent-runtime-architecture

/**
 * Tool execution dispatcher and types.
 * Dispatches tool calls to the appropriate executor based on tool name.
 */

import type { AgentRole } from "./types.js";
import type { AuditLogEntry } from "../session.js";
import { AuditLogger } from "../session.js";

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
 * Callback for audit logging file operations.
 */
export type AuditLogCallback = (
  entry: Omit<AuditLogEntry, "timestamp" | "session">
) => Promise<void>;

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
  /** Optional audit log callback for file operations */
  auditLog?: AuditLogCallback;
}

/**
 * Extended context for tools that need nested session capabilities.
 * Used by spawn_impl_session to spawn child sessions.
 */
export interface NestedSessionContext extends ExecutionContext {
  /** Current session ID */
  sessionId: string;
  /** Parent session ID (for nested sessions) */
  parentSessionId?: string;
  /** Current nesting depth */
  nestingDepth: number;
  /** Maximum nesting depth */
  maxNestingDepth: number;
  /** Function to spawn a child session */
  spawnChildSession?: (config: ChildSessionConfig) => Promise<ChildSessionResult>;
}

/**
 * Configuration for spawning a child session.
 */
export interface ChildSessionConfig {
  chainId: string;
  taskId: string;
  context?: string;
}

/**
 * Result from a child session.
 */
export interface ChildSessionResult {
  success: boolean;
  sessionId: string;
  iterations: number;
  tokensUsed: { input: number; output: number };
  error?: string;
  summary?: string;
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
import { executeReadFile } from "./definitions/read-file.js";
import { executeWriteFile } from "./definitions/write-file.js";
import { executeListFiles } from "./definitions/list-files.js";
import { executeSearchFiles } from "./definitions/search-files.js";

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
  ["read_file", executeReadFile],
  ["write_file", executeWriteFile],
  ["list_files", executeListFiles],
  ["search_files", executeSearchFiles],
]);

/**
 * Build an audit log entry from tool execution results.
 * Extracts tool-specific fields from params and result data.
 */
function buildAuditEntry(
  toolName: string,
  params: Record<string, unknown>,
  result: ToolResult
): Omit<AuditLogEntry, "timestamp" | "session"> {
  const entry: Omit<AuditLogEntry, "timestamp" | "session"> = {
    tool: toolName,
    result: result.success ? "success" : "error",
    governance: "pass", // If we got here, governance passed
  };

  // Extract path from params (common to all file tools)
  if (params.path) {
    entry.path = params.path as string;
  }

  // Extract tool-specific data from result
  if (result.success && result.data) {
    const data = result.data as Record<string, unknown>;

    switch (toolName) {
      case "read_file":
        if (typeof data.linesReturned === "number") {
          entry.lines = data.linesReturned;
        }
        break;

      case "write_file":
        if (data.action === "created" || data.action === "modified") {
          entry.action = data.action === "modified" ? "modify" : "create";
        }
        if (typeof data.bytes === "number") {
          entry.bytes = data.bytes;
        }
        break;

      case "list_files":
        if (typeof data.count === "number") {
          entry.count = data.count;
        }
        break;

      case "search_files":
        if (typeof data.totalMatches === "number") {
          entry.matches = data.totalMatches;
        }
        // For search_files, path is the search directory, not in params.path
        if (data.query) {
          entry.path = (params.path as string) || ".";
        }
        break;
    }
  }

  return entry;
}

/**
 * Build an audit log entry for a denied operation.
 * Used when governance denies a file operation.
 */
export function buildDeniedAuditEntry(
  toolName: string,
  params: Record<string, unknown>,
  reason: string
): Omit<AuditLogEntry, "timestamp" | "session"> {
  return {
    tool: toolName,
    path: params.path as string | undefined,
    result: "denied",
    governance: "deny",
    reason,
  };
}

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
      const result = await executor(params, context);

      // Audit log file operations
      if (context.auditLog && AuditLogger.shouldLog(toolName)) {
        await this.logFileOperation(toolName, params, result, context);
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const result: ToolResult = {
        success: false,
        error: `Tool execution failed: ${message}`,
      };

      // Audit log file operation errors
      if (context.auditLog && AuditLogger.shouldLog(toolName)) {
        await this.logFileOperation(toolName, params, result, context);
      }

      return result;
    }
  }

  /**
   * Log a file operation to the audit log.
   */
  private async logFileOperation(
    toolName: string,
    params: Record<string, unknown>,
    result: ToolResult,
    context: ExecutionContext
  ): Promise<void> {
    if (!context.auditLog) return;

    const entry = buildAuditEntry(toolName, params, result);
    await context.auditLog(entry);
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
