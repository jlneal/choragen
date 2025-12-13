// ADR: ADR-001-task-file-format

/**
 * task:approve command - move a task from in-review to done
 */

import {
  ChainManager,
  TaskManager,
  type MetricsCollector,
  type Task,
  type TaskStatus,
  approveTask,
  type TaskApprovedEvent,
} from "@choragen/core";

type EventEmitter = (
  event: Parameters<MetricsCollector["record"]>[0]
) => Promise<void>;

export interface TaskApproveContext {
  chainManager: ChainManager;
  taskManager?: TaskManager;
  emitEvent?: EventEmitter;
}

export interface TaskApproveOptions {
  chainId: string;
  taskId: string;
}

export interface TaskApproveResult {
  success: boolean;
  task?: Task;
  previousStatus?: TaskStatus;
  newStatus?: TaskStatus;
  requestId?: string;
  event?: TaskApprovedEvent;
  error?: string;
}

/**
 * Approve a task.
 */
export async function approveTaskCommand(
  context: TaskApproveContext,
  options: TaskApproveOptions
): Promise<TaskApproveResult> {
  const { chainId, taskId } = options;
  const taskManager = context.taskManager ?? context.chainManager.getTaskManager();
  const chain = await context.chainManager.getChain(chainId);

  const result = await approveTask({
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
      error: result.error || `Failed to approve task: ${taskId}`,
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
    event: result.event as TaskApprovedEvent | undefined,
  };
}

/**
 * Create a default context for the task:approve command.
 */
export function createTaskApproveContext(
  projectRoot: string
): TaskApproveContext {
  const chainManager = new ChainManager(projectRoot);
  return {
    chainManager,
    taskManager: chainManager.getTaskManager(),
  };
}
