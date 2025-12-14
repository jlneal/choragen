// ADR: ADR-015-commit-audit-mechanism
// Change request: docs/requests/change-requests/doing/CR-20251213-003-commit-audit.md

import type { PostCommitMetadata, StageGate } from "../types.js";

export interface PostCommitGate extends StageGate {
  type: "post_commit";
  commit?: PostCommitMetadata;
}

export interface AuditChainCreationResult {
  chainId?: string;
}

export type AuditChainCreator = (input: {
  workflowId: string;
  stageIndex: number;
  commit: PostCommitMetadata;
}) => Promise<AuditChainCreationResult | void>;

export interface PostCommitGateContext {
  workflowId: string;
  stageIndex: number;
}

/**
 * Fire-and-forget trigger to create an audit chain from a post-commit gate.
 *
 * Errors are intentionally swallowed to avoid blocking workflow progression.
 */
export function triggerPostCommitAudit(
  gate: PostCommitGate,
  context: PostCommitGateContext,
  createAuditChain?: AuditChainCreator,
  persist?: (auditChainId?: string) => Promise<void>
): void {
  if (gate.auditEnabled === false) return;
  if (!createAuditChain) return;
  if (!gate.commit) {
    throw new Error("post_commit gate requires commit metadata");
  }

  gate.auditTriggered = true;

  void createAuditChain({
    workflowId: context.workflowId,
    stageIndex: context.stageIndex,
    commit: gate.commit,
  })
    .then(async (result) => {
      if (result && typeof result === "object" && result.chainId) {
        gate.auditChainId = result.chainId;
        if (persist) {
          await persist(result.chainId);
        }
      }
    })
    .catch(() => {
      // Swallow errors; audit creation should not block workflow progression.
    });
}
