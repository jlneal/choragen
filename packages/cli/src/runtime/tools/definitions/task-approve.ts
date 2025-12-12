// ADR: ADR-010-agent-runtime-architecture

import { TaskManager } from "@choragen/core";
import type { ToolDefinition } from "../types.js";
import type { ToolResult, ExecutionContext } from "../executor.js";

/**
 * Approve a completed task.
 * Available only to control role (they review and approve work).
 */
export const taskApproveTool: ToolDefinition = {
  name: "task:approve",
  description: "Approve a completed task, moving it from in-review to done",
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
  category: "task",
  mutates: true,
};

/**
 * Execute task:approve tool.
 * Transitions task from in-review to done.
 */
export async function executeTaskApprove(
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
  const result = await taskManager.approveTask(chainId, taskId);

  if (!result.success) {
    return {
      success: false,
      error: result.error || `Failed to approve task: ${taskId}`,
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
