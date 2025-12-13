// ADR: ADR-001-task-file-format

/**
 * Request review helpers
 *
 * Approve or request changes on requests after all chains are approved.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { ChainManager } from "../tasks/chain-manager.js";
import type { Chain } from "../tasks/types.js";

export type RequestReviewStatus = "approved" | "changes_requested";

export interface RequestApprovedEvent {
  eventType: "request:approved";
  requestId: string;
  newStatus: RequestReviewStatus;
}

export interface RequestChangesRequestedEvent {
  eventType: "request:changes_requested";
  requestId: string;
  reason: string;
  newStatus: RequestReviewStatus;
}

export interface RequestReviewResult {
  success: boolean;
  requestId: string;
  reviewStatus?: RequestReviewStatus;
  requestPath?: string;
  chains?: Chain[];
  event?: RequestApprovedEvent | RequestChangesRequestedEvent;
  error?: string;
}

export interface RequestReviewContext {
  projectRoot: string;
  chainManager: ChainManager;
}

const REQUEST_DIRS = [
  "docs/requests/change-requests",
  "docs/requests/fix-requests",
] as const;

const REQUEST_STATUSES = ["todo", "doing", "backlog", "done"] as const;

function getRequestMetadataPath(projectRoot: string, requestId: string): string {
  return path.join(projectRoot, ".choragen", "requests", `${requestId}.json`);
}

async function ensureRequestMetaDir(projectRoot: string): Promise<void> {
  const dir = path.dirname(getRequestMetadataPath(projectRoot, "dummy"));
  await fs.mkdir(dir, { recursive: true });
}

async function findRequestPath(projectRoot: string, requestId: string): Promise<string | null> {
  for (const dir of REQUEST_DIRS) {
    for (const status of REQUEST_STATUSES) {
      const candidate = path.join(projectRoot, dir, status);
      try {
        const files = await fs.readdir(candidate);
        for (const file of files) {
          if (file.startsWith(requestId) && file.endsWith(".md")) {
            return path.join(candidate, file);
          }
        }
      } catch {
        // Directory missing, continue
      }
    }
  }
  return null;
}

async function validateAllChainsApproved(
  chainManager: ChainManager,
  requestId: string
): Promise<{ valid: true; chains: Chain[] } | { valid: false; chains: Chain[]; error: string }> {
  const chains = (await chainManager.getAllChains()).filter(
    (c) => c.requestId === requestId
  );

  if (chains.length === 0) {
    return {
      valid: false,
      chains,
      error: `No chains found for request: ${requestId}`,
    };
  }

  const notApproved = chains.filter((c) => c.reviewStatus !== "approved");
  if (notApproved.length > 0) {
    const details = notApproved
      .map((c) => `${c.id} [${c.reviewStatus ?? "unreviewed"}]`)
      .join(", ");
    return {
      valid: false,
      chains,
      error: `All chains must be approved before request review. Pending: ${details}`,
    };
  }

  return { valid: true, chains };
}

async function persistReviewStatus(
  projectRoot: string,
  requestId: string,
  reviewStatus: RequestReviewStatus,
  reason?: string
): Promise<void> {
  await ensureRequestMetaDir(projectRoot);
  const metadataPath = getRequestMetadataPath(projectRoot, requestId);
  const payload = {
    requestId,
    reviewStatus,
    reason,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(metadataPath, JSON.stringify(payload, null, 2), "utf-8");
}

export async function approveRequest(
  context: RequestReviewContext,
  requestId: string
): Promise<RequestReviewResult> {
  const requestPath = await findRequestPath(context.projectRoot, requestId);
  if (!requestPath) {
    return { success: false, requestId, error: `Request not found: ${requestId}` };
  }

  const validation = await validateAllChainsApproved(context.chainManager, requestId);
  if (!validation.valid) {
    return {
      success: false,
      requestId,
      chains: validation.chains,
      error: validation.error,
    };
  }

  await persistReviewStatus(context.projectRoot, requestId, "approved");

  return {
    success: true,
    requestId,
    reviewStatus: "approved",
    requestPath,
    chains: validation.chains,
    event: {
      eventType: "request:approved",
      requestId,
      newStatus: "approved",
    },
  };
}

export async function requestChangesForRequest(
  context: RequestReviewContext,
  requestId: string,
  reason: string
): Promise<RequestReviewResult> {
  const requestPath = await findRequestPath(context.projectRoot, requestId);
  if (!requestPath) {
    return { success: false, requestId, error: `Request not found: ${requestId}` };
  }

  const validation = await validateAllChainsApproved(context.chainManager, requestId);
  if (!validation.valid) {
    return {
      success: false,
      requestId,
      chains: validation.chains,
      error: validation.error,
    };
  }

  await persistReviewStatus(context.projectRoot, requestId, "changes_requested", reason);

  return {
    success: true,
    requestId,
    reviewStatus: "changes_requested",
    requestPath,
    chains: validation.chains,
    event: {
      eventType: "request:changes_requested",
      requestId,
      reason,
      newStatus: "changes_requested",
    },
  };
}
