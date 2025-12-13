// ADR: ADR-001-task-file-format

/**
 * Chain review helpers
 *
 * Approve or request changes on chains after all tasks are completed.
 */

import type { ChainReviewStatus, TaskStatus, Chain } from "../tasks/types.js";
import { ChainManager } from "../tasks/chain-manager.js";

export interface ChainApprovedEvent {
  eventType: "chain:approved";
  chainId: string;
  requestId?: string;
  newStatus: ChainReviewStatus;
}

export interface ChainChangesRequestedEvent {
  eventType: "chain:changes_requested";
  chainId: string;
  requestId?: string;
  reason: string;
  newStatus: ChainReviewStatus;
}

export interface ChainReviewResult {
  success: boolean;
  chain?: Chain;
  previousStatus?: TaskStatus;
  newStatus?: TaskStatus;
  reviewStatus?: ChainReviewStatus;
  event?: ChainApprovedEvent | ChainChangesRequestedEvent;
  error?: string;
}

export interface ChainReviewContext {
  chainManager: ChainManager;
}

function validateAllTasksDone(chain: Chain): { valid: boolean; error?: string } {
  const notDone = chain.tasks.filter((t) => t.status !== "done");
  if (notDone.length === 0) {
    return { valid: true };
  }

  const statusCounts = notDone.reduce<Record<TaskStatus, number>>((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<TaskStatus, number>);

  const details = Object.entries(statusCounts)
    .map(([status, count]) => `${count} ${status}`)
    .join(", ");

  return {
    valid: false,
    error: `All tasks must be done before chain review. Remaining: ${details}`,
  };
}

async function persistReviewStatus(
  chainManager: ChainManager,
  chainId: string,
  status: ChainReviewStatus
): Promise<Chain | null> {
  await chainManager.updateChain(chainId, { reviewStatus: status });
  return chainManager.getChain(chainId);
}

/**
 * Approve a chain (all tasks must be done).
 */
export async function approveChain(
  context: ChainReviewContext,
  chainId: string
): Promise<ChainReviewResult> {
  const chain = await context.chainManager.getChain(chainId);
  if (!chain) {
    return { success: false, error: `Chain not found: ${chainId}` };
  }

  const validation = validateAllTasksDone(chain);
  if (!validation.valid) {
    return {
      success: false,
      chain,
      previousStatus: context.chainManager.getChainStatus(chain),
      newStatus: "done",
      error: validation.error,
    };
  }

  const updated = await persistReviewStatus(context.chainManager, chainId, "approved");

  const reviewedChain = updated ?? chain;

  return {
    success: true,
    chain: reviewedChain,
    previousStatus: context.chainManager.getChainStatus(chain),
    newStatus: "done",
    reviewStatus: "approved",
    event: {
      eventType: "chain:approved",
      chainId,
      requestId: reviewedChain.requestId,
      newStatus: "approved",
    },
  };
}

/**
 * Request changes on a chain (all tasks must be done).
 */
export async function requestChainChanges(
  context: ChainReviewContext,
  chainId: string,
  reason: string
): Promise<ChainReviewResult> {
  const chain = await context.chainManager.getChain(chainId);
  if (!chain) {
    return { success: false, error: `Chain not found: ${chainId}` };
  }

  const validation = validateAllTasksDone(chain);
  if (!validation.valid) {
    return {
      success: false,
      chain,
      previousStatus: context.chainManager.getChainStatus(chain),
      newStatus: "done",
      error: validation.error,
    };
  }

  const updated = await persistReviewStatus(context.chainManager, chainId, "changes_requested");
  const reviewedChain = updated ?? chain;

  return {
    success: true,
    chain: reviewedChain,
    previousStatus: context.chainManager.getChainStatus(chain),
    newStatus: "done",
    reviewStatus: "changes_requested",
    event: {
      eventType: "chain:changes_requested",
      chainId,
      requestId: reviewedChain.requestId,
      reason,
      newStatus: "changes_requested",
    },
  };
}
