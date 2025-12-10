// ADR: ADR-011-web-api-architecture
"use client";

import { useState, useCallback } from "react";

import type { Session } from "@/components/sessions/session-card";
import type { SessionStatus } from "@/components/sessions/session-status-badge";
import type { SessionFilterState } from "@/components/sessions/session-filters";
import type { SessionSortState } from "@/components/sessions/session-sort";

/**
 * Combined filter and sort state for sessions
 */
export interface UseSessionFiltersState {
  filters: SessionFilterState;
  sort: SessionSortState;
}

/**
 * Return type for the useSessionFilters hook
 */
export interface UseSessionFiltersReturn {
  /** Current filter state */
  filters: SessionFilterState;
  /** Current sort state */
  sort: SessionSortState;
  /** Update filter state */
  setFilters: (filters: SessionFilterState) => void;
  /** Update sort state */
  setSort: (sort: SessionSortState) => void;
  /** Reset all filters and sort to defaults */
  reset: () => void;
  /** Apply filters and sort to a list of sessions */
  applyFiltersAndSort: (sessions: Session[]) => Session[];
}

/**
 * Derive session status from session data
 */
function deriveStatus(session: Session): SessionStatus {
  if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
    return "failed";
  }
  return "running";
}

/**
 * Default filter state
 */
const defaultFilters: SessionFilterState = {
  status: null,
  agent: null,
};

/**
 * Default sort state
 */
const defaultSort: SessionSortState = {
  field: "date",
  direction: "desc",
};

/**
 * Hook for managing session filter and sort state.
 * Provides methods to update state and apply filters/sort to session lists.
 */
export function useSessionFilters(
  initialFilters: SessionFilterState = defaultFilters,
  initialSort: SessionSortState = defaultSort
): UseSessionFiltersReturn {
  const [filters, setFilters] = useState<SessionFilterState>(initialFilters);
  const [sort, setSort] = useState<SessionSortState>(initialSort);

  const reset = useCallback(() => {
    setFilters(defaultFilters);
    setSort(defaultSort);
  }, []);

  const applyFiltersAndSort = useCallback(
    (sessions: Session[]): Session[] => {
      let result = [...sessions];

      // Apply status filter
      if (filters.status !== null) {
        result = result.filter((session) => deriveStatus(session) === filters.status);
      }

      // Apply agent filter
      if (filters.agent !== null) {
        result = result.filter((session) => session.agent === filters.agent);
      }

      // Apply sort
      result.sort((a, b) => {
        let comparison = 0;

        if (sort.field === "date") {
          const dateA = new Date(a.startedAt).getTime();
          const dateB = new Date(b.startedAt).getTime();
          comparison = dateA - dateB;
        } else if (sort.field === "files") {
          comparison = a.files.length - b.files.length;
        }

        return sort.direction === "asc" ? comparison : -comparison;
      });

      return result;
    },
    [filters, sort]
  );

  return {
    filters,
    sort,
    setFilters,
    setSort,
    reset,
    applyFiltersAndSort,
  };
}
