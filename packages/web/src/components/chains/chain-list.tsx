// ADR: ADR-011-web-api-architecture
"use client";

import { GitBranch, Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { ChainCard, type ChainType } from "./chain-card";
import type { ChainStatus } from "./chain-status-badge";

/**
 * Chain data structure for the list
 */
export interface ChainListItem {
  id: string;
  title: string;
  type?: ChainType;
  requestId: string;
  taskCount: number;
  progress: number;
  status: ChainStatus;
}

interface ChainListProps {
  chains: ChainListItem[];
  isLoading?: boolean;
  className?: string;
}

/**
 * Loading skeleton for a single chain card
 */
function ChainCardSkeleton() {
  return (
    <Card>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-1.5 flex-1" />
          <Skeleton className="h-4 w-8" />
        </div>
      </div>
    </Card>
  );
}

/**
 * Loading state with multiple skeleton cards
 */
function ChainListLoading() {
  const SKELETON_COUNT = 4;
  return (
    <div className="grid gap-4">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <ChainCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Empty state when no chains match filters
 */
function ChainListEmpty() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No chains found</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          No chains match your current filters. Try adjusting your filters or
          create a new chain to get started.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when there are no chains at all
 */
function ChainListNoChains() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <GitBranch className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No chains yet</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Task chains provide traceability, context preservation, and progress
          tracking for multi-session work. Create your first chain to get
          started.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * ChainList renders a list of ChainCard components.
 * Handles loading and empty states.
 */
export function ChainList({ chains, isLoading, className }: ChainListProps) {
  if (isLoading) {
    return <ChainListLoading />;
  }

  if (chains.length === 0) {
    return <ChainListEmpty />;
  }

  return (
    <div className={cn("grid gap-4", className)}>
      {chains.map((chain) => (
        <ChainCard
          key={chain.id}
          id={chain.id}
          title={chain.title}
          type={chain.type}
          requestId={chain.requestId}
          taskCount={chain.taskCount}
          progress={chain.progress}
          status={chain.status}
        />
      ))}
    </div>
  );
}

/**
 * Export skeleton and empty state components for reuse
 */
export { ChainCardSkeleton, ChainListLoading, ChainListNoChains };
