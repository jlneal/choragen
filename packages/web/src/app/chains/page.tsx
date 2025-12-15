// ADR: ADR-011-web-api-architecture
"use client";

export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";

import Link from "next/link";
import { Plus } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
  ChainFilters,
  type ChainFilterState,
} from "@/components/chains/chain-filters";
import {
  ChainSort,
  type ChainSortState,
} from "@/components/chains/chain-sort";
import {
  ChainList,
  ChainListNoChains,
  type ChainListItem,
} from "@/components/chains/chain-list";
import type { ChainStatus } from "@/components/chains/chain-status-badge";
import type { ChainType } from "@/components/chains/chain-card";

/**
 * Derive chain status from tasks
 */
function deriveChainStatus(tasks: { status: string }[]): ChainStatus {
  if (tasks.length === 0) return "backlog";

  const statuses = tasks.map((t) => t.status);

  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("in-progress")) return "in-progress";
  if (statuses.includes("in-review")) return "in-review";
  if (statuses.every((s) => s === "done")) return "done";
  if (statuses.includes("todo")) return "todo";

  return "backlog";
}

/**
 * Calculate progress percentage from tasks
 */
function calculateProgress(tasks: { status: string }[]): number {
  if (tasks.length === 0) return 0;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  return Math.round((doneTasks / tasks.length) * 100);
}

/**
 * Map filter status to chain statuses for comparison
 */
function matchesFilterStatus(
  chainStatus: ChainStatus,
  filterStatus: "todo" | "in-progress" | "done" | null
): boolean {
  if (filterStatus === null) return true;

  switch (filterStatus) {
    case "todo":
      return chainStatus === "todo" || chainStatus === "backlog";
    case "in-progress":
      return chainStatus === "in-progress" || chainStatus === "in-review";
    case "done":
      return chainStatus === "done";
    default:
      return true;
  }
}

/**
 * Sort chains based on sort state
 */
function sortChains(
  chains: ChainListItem[],
  sort: ChainSortState,
  chainDates: Map<string, Date>
): ChainListItem[] {
  const sorted = [...chains];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sort.field) {
      case "date": {
        const dateA = chainDates.get(a.id) ?? new Date(0);
        const dateB = chainDates.get(b.id) ?? new Date(0);
        comparison = dateA.getTime() - dateB.getTime();
        break;
      }
      case "progress":
        comparison = a.progress - b.progress;
        break;
      case "name":
        comparison = a.id.localeCompare(b.id);
        break;
    }

    return sort.direction === "asc" ? comparison : -comparison;
  });

  return sorted;
}

export default function ChainsPage() {
  // Filter and sort state
  const [filters, setFilters] = useState<ChainFilterState>({
    status: null,
    type: null,
  });
  const [sort, setSort] = useState<ChainSortState>({
    field: "date",
    direction: "desc",
  });

  // Fetch chains from tRPC
  const { data: chains, isLoading } = trpc.chains.list.useQuery();

  // Transform and filter chains
  const { filteredChains, chainDates, hasAnyChains } = useMemo(() => {
    if (!chains) {
      return { filteredChains: [], chainDates: new Map<string, Date>(), hasAnyChains: false };
    }

    const hasAnyChains = chains.length > 0;
    const dates = new Map<string, Date>();

    // Transform chains to list items
    const listItems: ChainListItem[] = chains.map((chain) => {
      const status = deriveChainStatus(chain.tasks);
      const progress = calculateProgress(chain.tasks);

      // Store date for sorting
      dates.set(chain.id, new Date(chain.createdAt));

      return {
        id: chain.id,
        title: chain.title,
        type: chain.type as ChainType | undefined,
        requestId: chain.requestId,
        taskCount: chain.tasks.length,
        progress,
        status,
      };
    });

    // Apply filters
    const filtered = listItems.filter((chain) => {
      // Status filter
      if (!matchesFilterStatus(chain.status, filters.status)) {
        return false;
      }

      // Type filter
      if (filters.type !== null && chain.type !== filters.type) {
        return false;
      }

      return true;
    });

    return { filteredChains: filtered, chainDates: dates, hasAnyChains };
  }, [chains, filters]);

  // Sort the filtered chains
  const sortedChains = useMemo(() => {
    return sortChains(filteredChains, sort, chainDates);
  }, [filteredChains, sort, chainDates]);

  // Show special empty state if there are no chains at all
  if (!isLoading && !hasAnyChains) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Task Chains</h1>
          <p className="text-muted-foreground">
            View and manage your task chains and their progress
          </p>
        </div>
        <ChainListNoChains />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Task Chains</h1>
          <p className="text-muted-foreground">
            View and manage your task chains and their progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link href="/chains/new">
              <Plus className="h-4 w-4" />
              New Chain
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ChainFilters filters={filters} onFiltersChange={setFilters} />
          <ChainSort sort={sort} onSortChange={setSort} />
        </div>
        <Separator />
      </div>

      {/* Chain List */}
      <ChainList chains={sortedChains} isLoading={isLoading} />

      {/* Results count */}
      {!isLoading && sortedChains.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {sortedChains.length} of {chains?.length ?? 0} chains
        </p>
      )}
    </div>
  );
}
