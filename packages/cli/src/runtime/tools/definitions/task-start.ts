// ADR: ADR-010-agent-runtime-architecture

import { TaskManager } from "@choragen/core";
import type { ToolDefinition } from "../types.js";
import type { ToolResult, ExecutionContext } from "../executor.js";

/**
 * Start working on a task.
 * Available only to control role (they assign tasks to impl agents).
 */
export const taskStartTool: ToolDefinition = {
  name: "task:start",
  description: "Start working on a task, moving it from todo to in-progress",
  parameters: {
    type: "object",
    properties: {
      chainId: {
        type: "string",
        description: "Chain ID (e.g., CHAIN-037-agent-runtime-core)",
      },
      taskId: {
        type: "string",
        description: "Task ID (e.g., 002-tool-registry)",
      },
    },
    required: ["chainId", "taskId"],
  },
  allowedRoles: ["control"],
};

/**
 * Execute task:start tool.
 * Transitions task from todo to in-progress.
 */
export async function executeTaskStart(
  params: Record<string, unknown>,
  context: ExecutionContext
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

  const taskManager = new TaskManager(context.workspaceRoot);
  const result = await taskManager.startTask(chainId, taskId);

  if (!result.success) {
    return {
      success: false,
      error: result.error || `Failed to start task: ${taskId}`,
    };
  }

  return {
    success: true,
    data: {
      taskId: result.task.id,
      chainId: result.task.chainId,
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
      title: result.task.title,
    },
  };
}
