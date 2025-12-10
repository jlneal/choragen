// ADR: ADR-011-web-api-architecture

"use client";

/**
 * GitStatus Component
 *
 * Displays git status in the header showing:
 * - Current branch name
 * - Clean/dirty indicator (colored dot)
 * - Count of changed files when dirty
 *
 * Polls for status updates to keep the display current.
 */

import { GitBranch, Circle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Polling interval for git status updates (ms) */
const POLL_INTERVAL_MS = 5000;

/**
 * GitStatus displays the current git branch and working directory status.
 * Shows a colored indicator: green for clean, amber for dirty.
 */
export function GitStatus() {
  const { data, isLoading, isError } = trpc.git.status.useQuery(undefined, {
    refetchInterval: POLL_INTERVAL_MS,
    // Keep previous data while refetching to avoid flicker
    placeholderData: (prev) => prev,
  });

  if (isLoading) {
    return <GitStatusSkeleton />;
  }

  if (isError || !data) {
    return <GitStatusError />;
  }

  const changedCount = data.staged.length + data.modified.length + data.untracked.length;
  const isClean = changedCount === 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GitBranch className="h-4 w-4" />
            <span className="max-w-[120px] truncate font-medium">
              {data.branch}
            </span>
            <StatusIndicator isClean={isClean} changedCount={changedCount} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end">
          <GitStatusTooltip
            branch={data.branch}
            staged={data.staged.length}
            modified={data.modified.length}
            untracked={data.untracked.length}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface StatusIndicatorProps {
  isClean: boolean;
  changedCount: number;
}

/**
 * StatusIndicator shows a colored dot with optional change count.
 * Green = clean working directory
 * Amber = uncommitted changes
 */
function StatusIndicator({ isClean, changedCount }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-1">
      <Circle
        className={cn(
          "h-2.5 w-2.5 fill-current",
          isClean
            ? "text-green-500 dark:text-green-400"
            : "text-amber-500 dark:text-amber-400"
        )}
      />
      {!isClean && (
        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
          {changedCount}
        </span>
      )}
    </div>
  );
}

interface GitStatusTooltipProps {
  branch: string;
  staged: number;
  modified: number;
  untracked: number;
}

/**
 * GitStatusTooltip shows detailed breakdown of changes on hover.
 */
function GitStatusTooltip({
  branch,
  staged,
  modified,
  untracked,
}: GitStatusTooltipProps) {
  const total = staged + modified + untracked;
  const isClean = total === 0;

  return (
    <div className="space-y-1.5 text-xs">
      <div className="font-medium">Branch: {branch}</div>
      {isClean ? (
        <div className="text-green-600 dark:text-green-400">
          Working directory clean
        </div>
      ) : (
        <div className="space-y-0.5">
          {staged > 0 && (
            <div className="text-green-600 dark:text-green-400">
              {staged} staged
            </div>
          )}
          {modified > 0 && (
            <div className="text-amber-600 dark:text-amber-400">
              {modified} modified
            </div>
          )}
          {untracked > 0 && (
            <div className="text-muted-foreground">{untracked} untracked</div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * GitStatusSkeleton shows a loading placeholder.
 */
function GitStatusSkeleton() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <GitBranch className="h-4 w-4" />
      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
      <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-muted" />
    </div>
  );
}

/**
 * GitStatusError shows when git status cannot be fetched.
 */
function GitStatusError() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GitBranch className="h-4 w-4" />
            <span className="text-destructive">—</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end">
          <span className="text-xs">Unable to fetch git status</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
