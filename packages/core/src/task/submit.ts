// ADR: ADR-001-task-file-format

/**
 * Task submission helpers
 *
 * Moves a task from in-progress to in-review and prepares hook/event payloads.
 */

import type { TransitionResult, TaskStatus } from "../tasks/types.js";
import { TaskManager } from "../tasks/task-manager.js";

export interface TaskSubmittedEvent {
  eventType: "task:submitted";
  chainId: string;
  taskId: string;
  previousStatus: TaskStatus;
  newStatus: TaskStatus;
}

export interface SubmitTaskOptions {
  taskManager: TaskManager;
  chainId: string;
  taskId: string;
}

export interface SubmitTaskResult extends TransitionResult {
  event?: TaskSubmittedEvent;
}

/**
 * Submit a task for review.
 *
 * Validates the task is in-progress, transitions to in-review,
 * and returns an event payload for downstream hooks.
 */
export async function submitTask(
  options: SubmitTaskOptions
): Promise<SubmitTaskResult> {
  const { taskManager, chainId, taskId } = options;

  const task = await taskManager.getTask(chainId, taskId);
  if (!task) {
    return {
      success: false,
      task: null!,
      previousStatus: "backlog",
      newStatus: "in-review",
      error: `Task not found: ${taskId} in chain ${chainId}`,
    };
  }

  if (task.status !== "in-progress") {
    return {
      success: false,
      task,
      previousStatus: task.status,
      newStatus: "in-review",
      error: `Task ${taskId} is in '${task.status}' status. Submit is only allowed from in-progress.`,
    };
  }

  const result = await taskManager.completeTask(chainId, taskId);
  if (!result.success) {
    return result;
  }

  return {
    ...result,
    event: {
      eventType: "task:submitted",
      chainId,
      taskId,
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
    },
  };
}
