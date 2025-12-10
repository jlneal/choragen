"use client";

// ADR: ADR-011-web-api-architecture

/**
 * LinkedChains - Displays chains associated with a request
 *
 * Queries chains by requestId and displays them with
 * chain ID, title, status, and progress.
 */

import Link from "next/link";
import { GitBranch, ListTodo } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

import {
  ChainStatusBadge,
  type ChainStatus,
} from "@/components/chains/chain-status-badge";
import { ChainProgress } from "@/components/chains/chain-progress";

interface LinkedChainsProps {
  /** Request ID to filter chains by */
  requestId: string;
  /** Additional class names */
  className?: string;
}

/**
 * Compute chain status from tasks
 */
function computeChainStatus(
  tasks: Array<{ status: string }>
): ChainStatus {
  if (tasks.length === 0) return "backlog";

  const statuses = tasks.map((t) => t.status);
  const allDone = statuses.every((s) => s === "done");
  const anyInProgress = statuses.some((s) => s === "in-progress");
  const anyInReview = statuses.some((s) => s === "in-review");
  const anyBlocked = statuses.some((s) => s === "blocked");

  if (allDone) return "done";
  if (anyBlocked) return "blocked";
  if (anyInReview) return "in-review";
  if (anyInProgress) return "in-progress";
  return "todo";
}

/**
 * Compute chain progress from tasks
 */
function computeChainProgress(tasks: Array<{ status: string }>): number {
  if (tasks.length === 0) return 0;
  const doneCount = tasks.filter((t) => t.status === "done").length;
  return Math.round((doneCount / tasks.length) * 100);
}

/**
 * LinkedChains displays chains associated with a specific request.
 * Uses tRPC to query chains and filters by requestId.
 */
export function LinkedChains({ requestId, className }: LinkedChainsProps) {
  const { data: chains, isLoading, error } = trpc.chains.list.useQuery();

  // Filter chains by requestId
  const linkedChains = chains?.filter(
    (chain) => chain.requestId === requestId
  );

  if (isLoading) {
    return <LinkedChainsSkeleton className={className} />;
  }

  if (error) {
    return (
      <div className={cn("text-sm text-destructive", className)}>
        Failed to load linked chains.
      </div>
    );
  }

  if (!linkedChains || linkedChains.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <h3 className="text-sm font-medium">Linked Chains</h3>
        <p className="text-sm text-muted-foreground">
          No chains linked to this request.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-medium">
        Linked Chains ({linkedChains.length})
      </h3>
      <div className="space-y-2">
        {linkedChains.map((chain) => {
          const tasks = chain.tasks ?? [];
          return (
            <LinkedChainCard
              key={chain.id}
              id={chain.id}
              title={chain.title}
              status={computeChainStatus(tasks)}
              taskCount={tasks.length}
              progress={computeChainProgress(tasks)}
            />
          );
        })}
      </div>
    </div>
  );
}

interface LinkedChainCardProps {
  id: string;
  title: string;
  status: ChainStatus;
  taskCount: number;
  progress: number;
}

/**
 * Compact chain card for display in linked chains list
 */
function LinkedChainCard({
  id,
  title,
  status,
  taskCount,
  progress,
}: LinkedChainCardProps) {
  return (
    <Link href={`/chains/${id}`} className="block">
      <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <GitBranch className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium truncate">{id}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {title}
              </p>
            </div>
            <ChainStatusBadge status={status} className="text-xs" />
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              <ListTodo className="h-3 w-3" />
              <span>
                {taskCount} {taskCount === 1 ? "task" : "tasks"}
              </span>
            </div>
          </div>

          <ChainProgress progress={progress} size="sm" />
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Loading skeleton for LinkedChains
 */
export function LinkedChainsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-4 w-32" />
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
