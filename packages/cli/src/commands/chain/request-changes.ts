// ADR: ADR-001-task-file-format

/**
 * chain:request_changes command - mark chain for rework after review
 */

import {
  ChainManager,
  type MetricsCollector,
  type Chain,
  requestChainChanges,
} from "@choragen/core";

type EventEmitter = (
  event: Parameters<MetricsCollector["record"]>[0]
) => Promise<void>;

export interface ChainRequestChangesContext {
  chainManager: ChainManager;
  emitEvent?: EventEmitter;
}

export interface ChainRequestChangesOptions {
  chainId: string;
  reason: string;
}

export interface ChainRequestChangesResult {
  success: boolean;
  chain?: Chain;
  reviewStatus?: Chain["reviewStatus"];
  error?: string;
}

/**
 * Request changes on a chain.
 */
export async function requestChainChangesCommand(
  context: ChainRequestChangesContext,
  options: ChainRequestChangesOptions
): Promise<ChainRequestChangesResult> {
  const { chainId, reason } = options;

  if (!reason) {
    return {
      success: false,
      error: "Reason is required to request changes on a chain",
    };
  }

  const result = await requestChainChanges(
    { chainManager: context.chainManager },
    chainId,
    reason
  );

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
        reason,
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
 * Create default context for chain:request_changes.
 */
export function createChainRequestChangesContext(
  projectRoot: string
): ChainRequestChangesContext {
  const chainManager = new ChainManager(projectRoot);
  return { chainManager };
}
