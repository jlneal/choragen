// ADR: ADR-010-agent-runtime-architecture

import type { ToolDefinition } from "../types.js";
import type { ToolResult, ExecutionContext } from "../executor.js";

/**
 * Spawn a nested impl agent session.
 * Available only to control role (they delegate work to impl agents).
 */
export const spawnImplSessionTool: ToolDefinition = {
  name: "spawn_impl_session",
  description:
    "Spawn a nested implementation agent session to work on a specific task",
  parameters: {
    type: "object",
    properties: {
      chainId: {
        type: "string",
        description: "Chain ID (e.g., CHAIN-037-agent-runtime-core)",
      },
      taskId: {
        type: "string",
        description: "Task ID to assign to the impl agent",
      },
      context: {
        type: "string",
        description: "Additional context or instructions for the impl agent",
      },
    },
    required: ["chainId", "taskId"],
  },
  allowedRoles: ["control"],
};

/**
 * Execute spawn_impl_session tool.
 * Returns stub result - nested sessions are Phase 2.
 */
export async function executeSpawnImplSession(
  params: Record<string, unknown>,
  _context: ExecutionContext
): Promise<ToolResult> {
  const chainId = params.chainId as string;
  const taskId = params.taskId as string;

  if (!chainId) {
    return {
      success: false,
      error: "Missing required parameter: chainId",
    };
  }

  if (!taskId) {
    return {
      success: false,
      error: "Missing required parameter: taskId",
    };
  }

  // Phase 2 stub - nested sessions not yet implemented
  return {
    success: false,
    error: "Nested sessions not yet implemented (Phase 2)",
    data: {
      chainId,
      taskId,
      context: params.context || null,
      message:
        "spawn_impl_session is a Phase 2 feature. For now, use task:start to mark the task as in-progress and manually hand off to an impl agent.",
    },
  };
}
