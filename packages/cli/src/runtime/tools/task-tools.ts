// ADR: ADR-013-agent-tools-design

import { TaskManager } from "@choragen/core";
import type { ToolDefinition } from "./types.js";
import type { ToolResult, ExecutionContext } from "./executor.js";

type TaskEventPayload = Record<string, unknown>;

/**
 * Emit a lifecycle event if an event emitter is configured.
 */
async function emitTaskEvent(
  context: ExecutionContext,
  eventType: string,
  payload: TaskEventPayload
): Promise<void> {
  if (context.eventEmitter) {
    try {
      await context.eventEmitter({ type: eventType, payload });
    } catch {
      // Event emission failures should not block tool execution
    }
  }
}

/**
 * Submit a task for review.
 */
export const taskSubmitTool: ToolDefinition = {
  name: "task:submit",
  description: "Submit a task for review, moving it from in-progress to in-review",
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
  category: "task",
  mutates: true,
};

/**
 * Execute task:submit tool.
 * Transitions task from in-progress to in-review and emits task.submitted.
 */
export async function executeTaskSubmit(
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

  // If summary provided, update task notes before submission
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
      error: result.error || `Failed to submit task: ${taskId}`,
    };
  }

  const eventPayload = {
    chainId: result.task.chainId,
    taskId: result.task.id,
    previousStatus: result.previousStatus,
    newStatus: result.newStatus,
    summary: summary ?? null,
  };

  await emitTaskEvent(context, "task.submitted", eventPayload);

  return {
    success: true,
    data: {
      ...eventPayload,
      title: result.task.title,
    },
  };
}

/**
 * Request changes on a task.
 */
export const taskRequestChangesTool: ToolDefinition = {
  name: "task:request_changes",
  description: "Request changes on a task, moving it from in-review back to in-progress",
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
      reason: {
        type: "string",
        description: "Reason for requesting changes",
      },
      suggestions: {
        type: "array",
        description: "Optional suggestions to address the feedback",
        items: {
          type: "string",
        },
      },
    },
    required: ["chainId", "taskId", "reason"],
  },
  category: "task",
  mutates: true,
};

/**
 * Execute task:request_changes tool.
 * Transitions task from in-review back to in-progress and emits task.changes_requested.
 */
export async function executeTaskRequestChanges(
  params: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  const chainId = params.chainId as string;
  const taskId = params.taskId as string;
  const reason = params.reason as string | undefined;
  const suggestions = params.suggestions as string[] | undefined;

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

  if (!reason) {
    return {
      success: false,
      error: "Missing required parameter: reason",
    };
  }

  if (suggestions && !Array.isArray(suggestions)) {
    return {
      success: false,
      error: "Invalid parameter: suggestions must be an array of strings",
    };
  }

  const taskManager = new TaskManager(context.workspaceRoot);

  // Persist change request details in task notes before transition
  const task = await taskManager.getTask(chainId, taskId);
  if (task) {
    const existingNotes = task.notes || "";
    const suggestionBlock =
      suggestions && suggestions.length > 0
        ? `\nSuggestions:\n- ${suggestions.join("\n- ")}`
        : "";
    const changeNote = `\n\n## Change Request\nReason: ${reason}${suggestionBlock}`;
    await taskManager.updateTask(chainId, taskId, {
      notes: existingNotes + changeNote,
    });
  }

  const result = await taskManager.reworkTask(chainId, taskId, reason);

  if (!result.success) {
    return {
      success: false,
      error: result.error || `Failed to request changes for task: ${taskId}`,
    };
  }

  const eventPayload = {
    chainId: result.task.chainId,
    taskId: result.task.id,
    previousStatus: result.previousStatus,
    newStatus: result.newStatus,
    reason,
    suggestions: suggestions ?? [],
  };

  await emitTaskEvent(context, "task.changes_requested", eventPayload);

  return {
    success: true,
    data: {
      ...eventPayload,
      title: result.task.title,
    },
  };
}
