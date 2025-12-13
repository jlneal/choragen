// ADR: ADR-001-task-file-format

/**
 * Default workflow event handlers.
 *
 * These handlers update task/chain/request state and trigger side effects
 * (file moves, agent spawning) when lifecycle events fire.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { TaskManager } from "../tasks/task-manager.js";
import { ChainManager } from "../tasks/chain-manager.js";
import type { WorkflowEvent, WorkflowEventType } from "./events.js";
import type { TaskStatus } from "../tasks/types.js";

export interface HookContext {
  projectRoot: string;
  taskManager: TaskManager;
  chainManager: ChainManager;
  spawnAgent?: (role: string, context?: Record<string, unknown>) => Promise<void> | void;
  fileMover?: (from: string, to: string) => Promise<void> | void;
}

async function defaultFileMover(from: string, to: string): Promise<void> {
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.rename(from, to);
}

async function updateTaskStatus(
  ctx: HookContext,
  chainId: string,
  taskId: string,
  targetStatus: TaskStatus
): Promise<void> {
  const task = await ctx.taskManager.getTask(chainId, taskId);
  if (!task) return;
  if (task.status === targetStatus) return;
  // Only attempt transition when allowed; failures are ignored to keep hooks non-blocking
  await ctx.taskManager.transitionTask(chainId, taskId, targetStatus);
}

async function persistRequestReviewStatus(
  projectRoot: string,
  requestId: string,
  reviewStatus: "approved" | "changes_requested",
  reason?: string
): Promise<void> {
  const dir = path.join(projectRoot, ".choragen", "requests");
  await fs.mkdir(dir, { recursive: true });
  const metaPath = path.join(dir, `${requestId}.json`);
  const payload = {
    requestId,
    reviewStatus,
    reason,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(metaPath, JSON.stringify(payload, null, 2), "utf-8");
}

export function createTaskSubmittedHandler(ctx: HookContext) {
  return async (event: WorkflowEvent<"task:submitted">): Promise<void> => {
    const { chainId, taskId, newStatus } = event.payload;
    await updateTaskStatus(ctx, chainId, taskId, newStatus);
  };
}

export function createTaskApprovedHandler(ctx: HookContext) {
  return async (event: WorkflowEvent<"task:approved">): Promise<void> => {
    const { chainId, taskId, newStatus } = event.payload;
    await updateTaskStatus(ctx, chainId, taskId, newStatus);
  };
}

export function createTaskChangesRequestedHandler(ctx: HookContext) {
  return async (event: WorkflowEvent<"task:changes_requested">): Promise<void> => {
    const { chainId, taskId, newStatus } = event.payload;
    await updateTaskStatus(ctx, chainId, taskId, newStatus);
  };
}

export function createChainApprovedHandler(ctx: HookContext) {
  return async (event: WorkflowEvent<"chain:approved">): Promise<void> => {
    const { chainId } = event.payload;
    await ctx.chainManager.updateChain(chainId, { reviewStatus: "approved" });
  };
}

export function createChainChangesRequestedHandler(ctx: HookContext) {
  return async (event: WorkflowEvent<"chain:changes_requested">): Promise<void> => {
    const { chainId } = event.payload;
    await ctx.chainManager.updateChain(chainId, { reviewStatus: "changes_requested" });
  };
}

export function createRequestApprovedHandler(ctx: HookContext) {
  return async (event: WorkflowEvent<"request:approved">): Promise<void> => {
    await persistRequestReviewStatus(ctx.projectRoot, event.payload.requestId, "approved");
  };
}

export function createRequestChangesRequestedHandler(ctx: HookContext) {
  return async (event: WorkflowEvent<"request:changes_requested">): Promise<void> => {
    await persistRequestReviewStatus(
      ctx.projectRoot,
      event.payload.requestId,
      "changes_requested",
      event.payload.reason
    );
  };
}

export function createSpawnHandler(
  ctx: HookContext,
  role: string,
  extraContext?: Record<string, unknown>
) {
  return async (_event: WorkflowEvent<WorkflowEventType>): Promise<void> => {
    if (!ctx.spawnAgent) return;
    await ctx.spawnAgent(role, extraContext);
  };
}

export function createFileMoveHandler(ctx: HookContext, from: string, to: string) {
  return async (): Promise<void> => {
    const mover = ctx.fileMover ?? defaultFileMover;
    await mover(path.resolve(ctx.projectRoot, from), path.resolve(ctx.projectRoot, to));
  };
}
