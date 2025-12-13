// ADR: ADR-001-task-file-format

/**
 * task:submit command - move a task from in-progress to in-review
 */

import {
  ChainManager,
  TaskManager,
  type MetricsCollector,
  type Task,
  type TaskStatus,
  submitTask,
  type TaskSubmittedEvent,
} from "@choragen/core";

type EventEmitter = (
  event: Parameters<MetricsCollector["record"]>[0]
) => Promise<void>;

export interface TaskSubmitContext {
  chainManager: ChainManager;
  taskManager?: TaskManager;
  emitEvent?: EventEmitter;
}

export interface TaskSubmitOptions {
  chainId: string;
  taskId: string;
}

export interface TaskSubmitResult {
  success: boolean;
  task?: Task;
  previousStatus?: TaskStatus;
  newStatus?: TaskStatus;
  requestId?: string;
  event?: TaskSubmittedEvent;
  error?: string;
}

/**
 * Submit a task for review.
 */
export async function submitTaskCommand(
  context: TaskSubmitContext,
  options: TaskSubmitOptions
): Promise<TaskSubmitResult> {
  const { chainId, taskId } = options;
  const taskManager = context.taskManager ?? context.chainManager.getTaskManager();
  const chain = await context.chainManager.getChain(chainId);

  const result = await submitTask({
    taskManager,
    chainId,
    taskId,
  });

  if (!result.success) {
    return {
      success: false,
      task: result.task,
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
      error: result.error || `Failed to submit task: ${taskId}`,
    };
  }

  if (result.event && context.emitEvent) {
    await context.emitEvent({
      eventType: result.event.eventType,
      entityType: "task",
      entityId: result.event.taskId,
      chainId: result.event.chainId,
      requestId: chain?.requestId,
      metadata: {
        previousStatus: result.event.previousStatus,
        newStatus: result.event.newStatus,
      },
    });
  }

  return {
    success: true,
    task: result.task,
    previousStatus: result.previousStatus,
    newStatus: result.newStatus,
    requestId: chain?.requestId,
    event: result.event,
  };
}

/**
 * Create a default context for the task:submit command.
 */
export function createTaskSubmitContext(
  projectRoot: string
): TaskSubmitContext {
  const chainManager = new ChainManager(projectRoot);
  return {
    chainManager,
    taskManager: chainManager.getTaskManager(),
  };
}
