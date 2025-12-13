// ADR: ADR-001-task-file-format

/**
 * Task review helpers
 *
 * Approve or request changes on in-review tasks with event payloads.
 */

import type { TransitionResult, TaskStatus } from "../tasks/types.js";
import { TaskManager } from "../tasks/task-manager.js";

export interface TaskApprovedEvent {
  eventType: "task:approved";
  chainId: string;
  taskId: string;
  previousStatus: TaskStatus;
  newStatus: TaskStatus;
}

export interface TaskChangesRequestedEvent {
  eventType: "task:changes_requested";
  chainId: string;
  taskId: string;
  reason: string;
  previousStatus: TaskStatus;
  newStatus: TaskStatus;
}

export interface ReviewTaskOptions {
  taskManager: TaskManager;
  chainId: string;
  taskId: string;
}

export interface ApproveTaskOptions extends ReviewTaskOptions {}

export interface RequestChangesOptions extends ReviewTaskOptions {
  reason: string;
}

export interface ReviewTaskResult extends TransitionResult {
  event?: TaskApprovedEvent | TaskChangesRequestedEvent;
}

async function validateInReview(
  taskManager: TaskManager,
  chainId: string,
  taskId: string,
  targetStatus: TaskStatus
): Promise<TransitionResult | null> {
  const task = await taskManager.getTask(chainId, taskId);
  if (!task) {
    return {
      success: false,
      task: null!,
      previousStatus: "backlog",
      newStatus: targetStatus,
      error: `Task not found: ${taskId} in chain ${chainId}`,
    };
  }

  if (task.status !== "in-review") {
    return {
      success: false,
      task,
      previousStatus: task.status,
      newStatus: targetStatus,
      error: `Task ${taskId} is in '${task.status}' status. Action is only allowed from in-review.`,
    };
  }

  return null;
}

/**
 * Approve a task (in-review → done).
 */
export async function approveTask(
  options: ApproveTaskOptions
): Promise<ReviewTaskResult> {
  const { taskManager, chainId, taskId } = options;

  const invalid = await validateInReview(taskManager, chainId, taskId, "done");
  if (invalid) return invalid;

  const result = await taskManager.approveTask(chainId, taskId);
  if (!result.success) {
    return result;
  }

  return {
    ...result,
    event: {
      eventType: "task:approved",
      chainId,
      taskId,
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
    },
  };
}

/**
 * Request changes on a task (in-review → in-progress) with reason.
 */
export async function requestTaskChanges(
  options: RequestChangesOptions
): Promise<ReviewTaskResult> {
  const { taskManager, chainId, taskId, reason } = options;

  const invalid = await validateInReview(taskManager, chainId, taskId, "in-progress");
  if (invalid) return invalid;

  const result = await taskManager.reworkTask(chainId, taskId, reason);
  if (!result.success) {
    return result;
  }

  return {
    ...result,
    event: {
      eventType: "task:changes_requested",
      chainId,
      taskId,
      reason,
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
    },
  };
}
