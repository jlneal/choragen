// ADR: ADR-011-web-api-architecture

"use client";

/**
 * GitSection Component
 *
 * Combines GitPanel, CommitDialog, and CommitHistory into a unified
 * git management section for the dashboard.
 *
 * Features:
 * - File staging/unstaging via GitPanel
 * - Commit creation via CommitDialog
 * - Recent commit history via CommitHistory
 */

import { GitBranch } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { GitPanel } from "./git-panel";
import { CommitDialog } from "./commit-dialog";
import { CommitHistory } from "./commit-history";

/**
 * Props for the GitSection component
 */
interface GitSectionProps {
  /** Additional class names */
  className?: string;
  /** Whether to show commit history (default: true) */
  showHistory?: boolean;
  /** Number of commits to show in history (default: 5) */
  historyLimit?: number;
}

/**
 * GitSection provides a complete git management interface.
 * Combines staging, committing, and history viewing.
 */
export function GitSection({
  className,
  showHistory = true,
  historyLimit = 5,
}: GitSectionProps) {
  const { data: status } = trpc.git.status.useQuery(undefined, {
    refetchInterval: 5000,
    placeholderData: (prev) => prev,
  });

  const stagedCount = status?.staged.length ?? 0;
  const hasChanges = status
    ? status.staged.length + status.modified.length + status.untracked.length > 0
    : false;

  return (
    <div className={className}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Git</h2>
          {status && (
            <span className="text-sm text-muted-foreground">
              ({status.branch})
            </span>
          )}
        </div>
        {hasChanges && (
          <CommitDialog
            stagedCount={stagedCount}
            onCommitSuccess={() => {
              // Commit history will auto-refresh via polling
            }}
          />
        )}
      </div>

      {/* Git Panel - File staging */}
      <div className="space-y-4">
        <GitPanel defaultExpanded={true} />

        {/* Commit History */}
        {showHistory && <CommitHistory limit={historyLimit} />}
      </div>
    </div>
  );
}

/**
 * GitSectionCompact is a minimal version for dashboard overview.
 * Shows only the panel without history.
 */
export function GitSectionCompact({ className }: { className?: string }) {
  return <GitSection className={className} showHistory={false} />;
}
