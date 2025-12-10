// ADR: ADR-011-web-api-architecture
"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

import { SessionCard, type Session } from "./session-card";
import { SessionCardSkeleton } from "./session-card-skeleton";
import { SessionFilters, type SessionFilterState } from "./session-filters";
import { SessionSort, type SessionSortState } from "./session-sort";
import { SessionListEmpty, SessionListNoSessions } from "./session-empty";
import type { SessionStatus } from "./session-status-badge";

interface SessionListProps {
  className?: string;
}

/** Number of skeleton cards to show while loading */
const SKELETON_COUNT = 4;

/**
 * Loading state with multiple skeleton cards
 */
function SessionListLoading() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <SessionCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Session data as returned by tRPC (dates are serialized as strings)
 */
interface SessionData {
  chainId: string;
  agent: string;
  startedAt: string;
  files: string[];
  expiresAt?: string;
}

/**
 * Convert tRPC session data to Session type (parse date strings)
 */
function toSession(data: SessionData): Session {
  return {
    chainId: data.chainId,
    agent: data.agent,
    startedAt: new Date(data.startedAt),
    files: data.files,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
  };
}

/**
 * Derive session status from session data
 */
function deriveStatus(session: SessionData): SessionStatus {
  if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
    return "failed";
  }
  return "running";
}

/**
 * SessionList is the main client component for displaying sessions.
 * Handles data fetching via tRPC, filtering, and sorting.
 */
export function SessionList({ className }: SessionListProps) {
  // State for filters and sorting
  const [filters, setFilters] = useState<SessionFilterState>({
    status: null,
    agent: null,
  });
  const [sort, setSort] = useState<SessionSortState>({
    field: "date",
    direction: "desc",
  });

  // Fetch sessions via tRPC
  const { data: sessions, isLoading } = trpc.sessions.list.useQuery();

  // Apply filters and sorting
  const filteredAndSortedSessions = useMemo(() => {
    if (!sessions) return [];

    let result = [...sessions];

    // Apply status filter
    if (filters.status) {
      result = result.filter((s) => deriveStatus(s) === filters.status);
    }

    // Apply agent filter
    if (filters.agent) {
      result = result.filter((s) => s.agent === filters.agent);
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sort.field === "date") {
        const aTime = new Date(a.startedAt).getTime();
        const bTime = new Date(b.startedAt).getTime();
        const comparison = aTime - bTime;
        return sort.direction === "desc" ? -comparison : comparison;
      } else {
        // Sort by files count
        const comparison = a.files.length - b.files.length;
        return sort.direction === "desc" ? -comparison : comparison;
      }
    });

    return result;
  }, [sessions, filters, sort]);

  // Check if we have any sessions at all (before filtering)
  const hasNoSessions = !isLoading && (!sessions || sessions.length === 0);
  const hasNoFilteredResults =
    !isLoading && sessions && sessions.length > 0 && filteredAndSortedSessions.length === 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters and Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SessionFilters filters={filters} onFiltersChange={setFilters} />
        <SessionSort sort={sort} onSortChange={setSort} />
      </div>

      {/* Session List */}
      {isLoading ? (
        <SessionListLoading />
      ) : hasNoSessions ? (
        <SessionListNoSessions />
      ) : hasNoFilteredResults ? (
        <SessionListEmpty />
      ) : (
        <div className="grid gap-4">
          {filteredAndSortedSessions.map((session) => (
            <SessionCard key={session.chainId} session={toSession(session)} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Export loading component for reuse
 */
export { SessionListLoading };
