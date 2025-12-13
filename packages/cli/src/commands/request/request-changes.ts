// ADR: ADR-001-task-file-format

/**
 * request:request_changes command - request changes on a request after review
 */

import {
  ChainManager,
  type MetricsCollector,
  requestChangesForRequest,
} from "@choragen/core";

type EventEmitter = (
  event: Parameters<MetricsCollector["record"]>[0]
) => Promise<void>;

export interface RequestChangesContext {
  projectRoot: string;
  chainManager?: ChainManager;
  emitEvent?: EventEmitter;
}

export interface RequestChangesOptions {
  requestId: string;
  reason: string;
}

export interface RequestChangesResult {
  success: boolean;
  reviewStatus?: "approved" | "changes_requested";
  requestPath?: string;
  error?: string;
}

export async function requestChangesCommand(
  context: RequestChangesContext,
  options: RequestChangesOptions
): Promise<RequestChangesResult> {
  const { requestId, reason } = options;
  const chainManager = context.chainManager ?? new ChainManager(context.projectRoot);

  if (!reason) {
    return { success: false, error: "Reason is required to request changes" };
  }

  const result = await requestChangesForRequest(
    { projectRoot: context.projectRoot, chainManager },
    requestId,
    reason
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
        reason,
      },
    });
  }

  return {
    success: true,
    reviewStatus: result.reviewStatus,
    requestPath: result.requestPath,
  };
}

export function createRequestChangesContext(projectRoot: string): RequestChangesContext {
  return {
    projectRoot,
    chainManager: new ChainManager(projectRoot),
  };
}
