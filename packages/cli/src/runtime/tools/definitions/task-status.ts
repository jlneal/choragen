// ADR: ADR-010-agent-runtime-architecture

import { TaskManager } from "@choragen/core";
import type { ToolDefinition } from "../types.js";
import type { ToolResult, ExecutionContext } from "../executor.js";

/**
 * Get the status of the current task.
 * Available only to impl role (they need to know their current task).
 */
export const taskStatusTool: ToolDefinition = {
  name: "task:status",
  description:
    "Get the status and details of the current task being worked on",
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
  mutates: false,
};

/**
 * Execute task:status tool.
 * Reads task file and returns details.
 */
export async function executeTaskStatus(
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
  const task = await taskManager.getTask(chainId, taskId);

  if (!task) {
    return {
      success: false,
      error: `Task not found: ${taskId} in chain ${chainId}`,
    };
  }

  return {
    success: true,
    data: {
      id: task.id,
      chainId: task.chainId,
      title: task.title,
      status: task.status,
      type: task.type || "impl",
      description: task.description,
      expectedFiles: task.expectedFiles,
      acceptance: task.acceptance,
      constraints: task.constraints,
      notes: task.notes,
      reworkCount: task.reworkCount || 0,
      reworkReason: task.reworkReason,
    },
  };
}
