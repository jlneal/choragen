// ADR: ADR-001-task-file-format

/**
 * request:approve command - approve a request after all chains are approved
 */

import {
  ChainManager,
  type MetricsCollector,
  approveRequest,
} from "@choragen/core";

type EventEmitter = (
  event: Parameters<MetricsCollector["record"]>[0]
) => Promise<void>;

export interface RequestApproveContext {
  projectRoot: string;
  chainManager?: ChainManager;
  emitEvent?: EventEmitter;
}

export interface RequestApproveOptions {
  requestId: string;
}

export interface RequestApproveResult {
  success: boolean;
  reviewStatus?: "approved" | "changes_requested";
  requestPath?: string;
  error?: string;
}

export async function approveRequestCommand(
  context: RequestApproveContext,
  options: RequestApproveOptions
): Promise<RequestApproveResult> {
  const { requestId } = options;
  const chainManager = context.chainManager ?? new ChainManager(context.projectRoot);

  const result = await approveRequest(
    { projectRoot: context.projectRoot, chainManager },
    requestId
  );

  if (!result.success) {
    return {
      success: false,
      reviewStatus: result.reviewStatus,
      requestPath: result.requestPath,
      error: result.error,
    };
  }

  if (result.event && context.emitEvent) {
    await context.emitEvent({
      eventType: result.event.eventType,
      entityType: "request",
      entityId: requestId,
      metadata: {
        reviewStatus: result.reviewStatus,
      },
    });
  }

  return {
    success: true,
    reviewStatus: result.reviewStatus,
    requestPath: result.requestPath,
  };
}

export function createRequestApproveContext(projectRoot: string): RequestApproveContext {
  return {
    projectRoot,
    chainManager: new ChainManager(projectRoot),
  };
}
