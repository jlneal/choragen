// ADR: ADR-001-task-file-format

/**
 * task:request_changes command - send a task back for changes
 */

import {
  ChainManager,
  TaskManager,
  type MetricsCollector,
  type Task,
  type TaskStatus,
  requestTaskChanges,
  type TaskChangesRequestedEvent,
} from "@choragen/core";

type EventEmitter = (
  event: Parameters<MetricsCollector["record"]>[0]
) => Promise<void>;

export interface TaskRequestChangesContext {
  chainManager: ChainManager;
  taskManager?: TaskManager;
  emitEvent?: EventEmitter;
}

export interface TaskRequestChangesOptions {
  chainId: string;
  taskId: string;
  reason: string;
}

export interface TaskRequestChangesResult {
  success: boolean;
  task?: Task;
  previousStatus?: TaskStatus;
  newStatus?: TaskStatus;
  requestId?: string;
  event?: TaskChangesRequestedEvent;
  error?: string;
}

/**
 * Request changes on a task.
 */
export async function requestChangesCommand(
  context: TaskRequestChangesContext,
  options: TaskRequestChangesOptions
): Promise<TaskRequestChangesResult> {
  const { chainId, taskId, reason } = options;
  const taskManager = context.taskManager ?? context.chainManager.getTaskManager();
  const chain = await context.chainManager.getChain(chainId);

  if (!reason) {
    return {
      success: false,
      previousStatus: "in-review",
      newStatus: "in-progress",
      error: "Reason is required to request changes",
    };
  }

  const result = await requestTaskChanges({
    taskManager,
    chainId,
    taskId,
    reason,
  });

  if (!result.success) {
    return {
      success: false,
      task: result.task,
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
      error: result.error || `Failed to request changes for task: ${taskId}`,
    };
  }

  const event = result.event as TaskChangesRequestedEvent | undefined;
  if (event && context.emitEvent) {
    await context.emitEvent({
      eventType: event.eventType,
      entityType: "task",
      entityId: event.taskId,
      chainId: event.chainId,
      requestId: chain?.requestId,
      metadata: {
        previousStatus: event.previousStatus,
        newStatus: event.newStatus,
        reason: event.reason,
      },
    });
  }

  return {
    success: true,
    task: result.task,
    previousStatus: result.previousStatus,
    newStatus: result.newStatus,
    requestId: chain?.requestId,
    event,
  };
}

/**
 * Create a default context for the task:request_changes command.
 */
export function createTaskRequestChangesContext(
  projectRoot: string
): TaskRequestChangesContext {
  const chainManager = new ChainManager(projectRoot);
  return {
    chainManager,
    taskManager: chainManager.getTaskManager(),
  };
}
