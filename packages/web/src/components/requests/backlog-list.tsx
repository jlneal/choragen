// ADR: ADR-011-web-api-architecture
"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

import { RequestCard } from "./request-card";
import type { RequestStatus } from "./request-status-badge";
import type { RequestType } from "./request-type-badge";
import { RequestFilters, type RequestFilterState } from "./request-filters";
import { TagFilter } from "@/components/tags";
import { RequestCardSkeleton } from "./request-list";
import { SortableList, type SortableListItem } from "@/components/backlog";

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

/**
 * Request with rank for sortable list
 */
interface RankedRequestItem extends RequestItem, SortableListItem {}

interface BacklogListProps {
  className?: string;
}

/**
 * Loading state with multiple skeleton cards
 */
function BacklogListLoading() {
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
function BacklogListEmpty() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No backlog requests found</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          No backlog requests match your current filters. Try adjusting your filters.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when there are no backlog requests at all
 */
function BacklogListNoRequests() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Backlog is empty</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          No requests are currently in the backlog. Requests in the backlog are
          ideas or low-priority items that haven&apos;t been scheduled for work yet.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * BacklogList displays backlog requests with drag-and-drop reordering.
 */
export function BacklogList({ className }: BacklogListProps) {
  // State for filters and tags
  const [filters, setFilters] = useState<RequestFilterState>({
    status: null,
    domain: null,
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // Fetch only backlog requests
  const {
    data: requests = [],
    isLoading: isLoadingRequests,
    refetch: refetchRequests,
  } = trpc.requests.list.useQuery({ status: "backlog" });

  // Fetch backlog ranks
  const {
    data: ranks = [],
    isLoading: isLoadingRanks,
    refetch: refetchRanks,
  } = trpc.backlog.getRanks.useQuery();

  const isLoading = isLoadingRequests || isLoadingRanks;

  // Sync ranks with actual backlog requests
  const syncMutation = trpc.backlog.sync.useMutation({
    onSuccess: () => {
      refetchRanks();
    },
  });

  // Sync ranks when requests change
  const requestIds = useMemo(
    () => (requests as RequestItem[]).map((r) => r.id),
    [requests]
  );

  useEffect(() => {
    if (!isLoadingRequests && requestIds.length > 0) {
      syncMutation.mutate({ backlogRequestIds: requestIds });
    }
  }, [requestIds, isLoadingRequests, syncMutation]);

  // Promote mutation
  const promoteMutation = trpc.requests.promote.useMutation({
    onSuccess: () => {
      refetchRequests();
      refetchRanks();
      setPromotingId(null);
    },
    onError: () => {
      setPromotingId(null);
    },
  });

  // Reorder mutation
  const reorderMutation = trpc.backlog.reorder.useMutation({
    onSuccess: () => {
      refetchRanks();
      setIsReordering(false);
    },
    onError: () => {
      setIsReordering(false);
    },
  });

  const handlePromote = (requestId: string) => {
    setPromotingId(requestId);
    promoteMutation.mutate({ requestId });
  };

  const handleReorder = (requestId: string, newRank: number) => {
    setIsReordering(true);
    reorderMutation.mutate({ requestId, newRank });
  };

  // Create a map of request ID to rank
  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of ranks) {
      map.set(entry.requestId, entry.rank);
    }
    return map;
  }, [ranks]);

  // Extract unique domains for filter dropdown
  const availableDomains = useMemo(() => {
    const domains = new Set((requests as RequestItem[]).map((r) => r.domain));
    return Array.from(domains).sort();
  }, [requests]);

  // Extract unique tags for filter dropdown
  const availableTags = useMemo(() => {
    const tags = new Set(
      (requests as RequestItem[]).flatMap((r) => r.tags || [])
    );
    return Array.from(tags).sort();
  }, [requests]);

  // Apply filters and add ranks
  const filteredRequests = useMemo(() => {
    let result = [...(requests as RequestItem[])];

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

    // Add ranks to requests
    const rankedRequests: RankedRequestItem[] = result.map((r) => ({
      ...r,
      rank: rankMap.get(r.id) ?? Number.MAX_SAFE_INTEGER,
    }));

    // Sort by rank
    rankedRequests.sort((a, b) => a.rank - b.rank);

    return rankedRequests;
  }, [requests, filters, selectedTags, rankMap]);

  // Check if we have any requests at all (before filtering)
  const hasNoRequests = !isLoading && requests.length === 0;
  const hasNoFilteredResults =
    !isLoading && requests.length > 0 && filteredRequests.length === 0;

  // Disable drag when filters are active (would be confusing)
  const hasActiveFilters = filters.domain !== null || selectedTags.length > 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <RequestFilters
          filters={{ ...filters, status: null }}
          onFiltersChange={(f) => setFilters({ ...f, status: null })}
          availableDomains={availableDomains}
          hideStatusFilter
        />
        {hasActiveFilters && (
          <p className="text-sm text-muted-foreground">
            Drag-and-drop disabled while filters are active
          </p>
        )}
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
        <BacklogListLoading />
      ) : hasNoRequests ? (
        <BacklogListNoRequests />
      ) : hasNoFilteredResults ? (
        <BacklogListEmpty />
      ) : (
        <SortableList
          items={filteredRequests}
          onReorder={handleReorder}
          disabled={hasActiveFilters || isReordering}
          renderItem={(request) => (
            <RequestCard
              id={request.id}
              title={request.title}
              type={request.type}
              domain={request.domain}
              status={request.status}
              created={request.created}
              owner={request.owner}
              severity={request.severity}
              tags={request.tags}
              onPromote={handlePromote}
              isActionPending={promotingId === request.id}
              onTagClick={(tag: string) => {
                if (!selectedTags.includes(tag)) {
                  setSelectedTags([...selectedTags, tag]);
                }
              }}
            />
          )}
        />
      )}
    </div>
  );
}

export { BacklogListLoading, BacklogListNoRequests };
