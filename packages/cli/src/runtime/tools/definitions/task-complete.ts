// ADR: ADR-010-agent-runtime-architecture

import { TaskManager } from "@choragen/core";
import type { ToolDefinition } from "../types.js";
import type { ToolResult, ExecutionContext } from "../executor.js";

/**
 * Mark a task as complete.
 * Available only to impl role (they complete their assigned work).
 */
export const taskCompleteTool: ToolDefinition = {
  name: "task:complete",
  description:
    "Mark a task as complete, moving it from in-progress to in-review",
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
      summary: {
        type: "string",
        description: "Brief summary of what was accomplished",
      },
    },
    required: ["chainId", "taskId"],
  },
  allowedRoles: ["impl"],
};

/**
 * Execute task:complete tool.
 * Transitions task from in-progress to in-review.
 */
export async function executeTaskComplete(
  params: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  const chainId = params.chainId as string;
  const taskId = params.taskId as string;
  const summary = params.summary as string | undefined;

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

  // If summary provided, update task notes before completing
  if (summary) {
    const task = await taskManager.getTask(chainId, taskId);
    if (task) {
      const existingNotes = task.notes || "";
      const completionNote = `\n\n## Completion Summary\n${summary}`;
      await taskManager.updateTask(chainId, taskId, {
        notes: existingNotes + completionNote,
      });
    }
  }

  const result = await taskManager.completeTask(chainId, taskId);

  if (!result.success) {
    return {
      success: false,
      error: result.error || `Failed to complete task: ${taskId}`,
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
      summary: summary || null,
    },
  };
}
