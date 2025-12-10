// ADR: ADR-011-web-api-architecture
"use client";

import { useMemo, useState } from "react";
import { FileText, Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

import { RequestCard } from "./request-card";
import { RequestTabs, type RequestTab } from "./request-tabs";
import { RequestFilters, type RequestFilterState } from "./request-filters";
import { RequestSort, type RequestSortState } from "./request-sort";
import { TagFilter } from "@/components/tags";
import type { RequestStatus } from "./request-status-badge";
import type { RequestType } from "./request-type-badge";

/**
 * Request data structure from tRPC
 */
interface RequestItem {
  id: string;
  type: RequestType;
  title: string;
  domain: string;
  status: RequestStatus;
  created: string;
  owner?: string;
  severity?: string;
  tags: string[];
  filename: string;
}

interface RequestListProps {
  className?: string;
}

/**
 * Loading skeleton for a single request card
 */
function RequestCardSkeleton() {
  return (
    <Card>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-10" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </Card>
  );
}

/**
 * Loading state with multiple skeleton cards
 */
function RequestListLoading() {
  const SKELETON_COUNT = 4;
  return (
    <div className="grid gap-4">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <RequestCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Empty state when no requests match filters
 */
function RequestListEmpty() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No requests found</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          No requests match your current filters. Try adjusting your filters or
          create a new request to get started.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when there are no requests at all
 */
function RequestListNoRequests() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No requests yet</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Requests drive all work in Choragen. Change Requests (CRs) add new
          features, while Fix Requests (FRs) address bugs and issues. Create
          your first request to get started.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Status sort order for sorting by status
 */
const STATUS_ORDER: Record<RequestStatus, number> = {
  doing: 0,
  todo: 1,
  backlog: 2,
  done: 3,
};

/**
 * RequestList is the main client component for displaying requests.
 * Handles data fetching via tRPC, filtering, sorting, and tab switching.
 */
export function RequestList({ className }: RequestListProps) {
  // State for tabs, filters, sorting, and tags
  const [activeTab, setActiveTab] = useState<RequestTab>("all");
  const [filters, setFilters] = useState<RequestFilterState>({
    status: null,
    domain: null,
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState<RequestSortState>({
    field: "date",
    direction: "desc",
  });

  // Fetch requests based on active tab
  const allQuery = trpc.requests.list.useQuery(undefined, {
    enabled: activeTab === "all",
  });
  const crQuery = trpc.requests.listChangeRequests.useQuery(undefined, {
    enabled: activeTab === "change-request",
  });
  const frQuery = trpc.requests.listFixRequests.useQuery(undefined, {
    enabled: activeTab === "fix-request",
  });

  // Get the active query based on tab
  const activeQuery =
    activeTab === "all"
      ? allQuery
      : activeTab === "change-request"
        ? crQuery
        : frQuery;

  const requests = (activeQuery.data ?? []) as RequestItem[];
  const isLoading = activeQuery.isLoading;

  // Extract unique domains for filter dropdown
  const availableDomains = useMemo(() => {
    const domains = new Set(requests.map((r) => r.domain));
    return Array.from(domains).sort();
  }, [requests]);

  // Extract unique tags for filter dropdown
  const availableTags = useMemo(() => {
    const tags = new Set(requests.flatMap((r) => r.tags || []));
    return Array.from(tags).sort();
  }, [requests]);

  // Apply filters and sorting
  const filteredAndSortedRequests = useMemo(() => {
    let result = [...requests];

    // Apply status filter
    if (filters.status) {
      result = result.filter((r) => r.status === filters.status);
    }

    // Apply domain filter
    if (filters.domain) {
      result = result.filter((r) => r.domain === filters.domain);
    }

    // Apply tag filter (request must have ALL selected tags)
    if (selectedTags.length > 0) {
      result = result.filter((r) =>
        selectedTags.every((tag) => r.tags?.includes(tag))
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sort.field === "date") {
        const comparison = a.created.localeCompare(b.created);
        return sort.direction === "desc" ? -comparison : comparison;
      } else {
        // Sort by status
        const comparison = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        return sort.direction === "desc" ? -comparison : comparison;
      }
    });

    return result;
  }, [requests, filters, selectedTags, sort]);

  // Check if we have any requests at all (before filtering)
  const hasNoRequests = !isLoading && requests.length === 0;
  const hasNoFilteredResults =
    !isLoading && requests.length > 0 && filteredAndSortedRequests.length === 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Tabs */}
      <RequestTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Filters and Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <RequestFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableDomains={availableDomains}
        />
        <RequestSort sort={sort} onSortChange={setSort} />
      </div>

      {/* Tag Filter */}
      {availableTags.length > 0 && (
        <TagFilter
          selectedTags={selectedTags}
          availableTags={availableTags}
          onSelectionChange={setSelectedTags}
        />
      )}

      {/* Request List */}
      {isLoading ? (
        <RequestListLoading />
      ) : hasNoRequests ? (
        <RequestListNoRequests />
      ) : hasNoFilteredResults ? (
        <RequestListEmpty />
      ) : (
        <div className="grid gap-4">
          {filteredAndSortedRequests.map((request) => (
            <RequestCard
              key={request.id}
              id={request.id}
              title={request.title}
              type={request.type}
              domain={request.domain}
              status={request.status}
              created={request.created}
              owner={request.owner}
              severity={request.severity}
              tags={request.tags}
              onTagClick={(tag) => {
                if (!selectedTags.includes(tag)) {
                  setSelectedTags([...selectedTags, tag]);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Export skeleton and empty state components for reuse
 */
export { RequestCardSkeleton, RequestListLoading, RequestListNoRequests };
