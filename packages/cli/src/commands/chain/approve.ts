// ADR: ADR-001-task-file-format

/**
 * chain:approve command - approve a chain after all tasks are done
 */

import {
  ChainManager,
  type MetricsCollector,
  type Chain,
  approveChain,
} from "@choragen/core";

type EventEmitter = (
  event: Parameters<MetricsCollector["record"]>[0]
) => Promise<void>;

export interface ChainApproveContext {
  chainManager: ChainManager;
  emitEvent?: EventEmitter;
}

export interface ChainApproveOptions {
  chainId: string;
}

export interface ChainApproveResult {
  success: boolean;
  chain?: Chain;
  reviewStatus?: Chain["reviewStatus"];
  error?: string;
}

/**
 * Approve a chain.
 */
export async function approveChainCommand(
  context: ChainApproveContext,
  options: ChainApproveOptions
): Promise<ChainApproveResult> {
  const { chainId } = options;

  const result = await approveChain({ chainManager: context.chainManager }, chainId);

  if (!result.success) {
    return {
      success: false,
      chain: result.chain,
      reviewStatus: result.reviewStatus,
      error: result.error,
    };
  }

  if (result.event && context.emitEvent) {
    await context.emitEvent({
      eventType: result.event.eventType,
      entityType: "chain",
      entityId: result.event.chainId,
      requestId: result.event.requestId,
      metadata: {
        reviewStatus: result.reviewStatus,
      },
    });
  }

  return {
    success: true,
    chain: result.chain,
    reviewStatus: result.reviewStatus,
  };
}

/**
 * Create default context for chain:approve.
 */
export function createChainApproveContext(
  projectRoot: string
): ChainApproveContext {
  const chainManager = new ChainManager(projectRoot);
  return { chainManager };
}
