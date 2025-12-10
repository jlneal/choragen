// ADR: ADR-011-web-api-architecture
"use client";

/**
 * Hook for managing time range filter state
 *
 * Provides state and handlers for selecting a time range and calculating
 * the corresponding `since` Date for filtering metrics.
 */
import { useState, useCallback, useMemo } from "react";

/**
 * Available time range options
 */
export type TimeRange = "7d" | "30d" | "90d" | "all";

/**
 * Time range options with labels for display
 */
export const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "all", label: "All" },
];

export interface UseTimeRangeReturn {
  /** Currently selected time range */
  range: TimeRange;
  /** Calculated since Date, or undefined for "all" */
  since: Date | undefined;
  /** Update the selected time range */
  setRange: (range: TimeRange) => void;
}

/**
 * Calculate the since Date from a time range selection.
 *
 * @param range - The selected time range
 * @returns Date for the start of the range, or undefined for "all"
 */
function getSinceDate(range: TimeRange): Date | undefined {
  if (range === "all") return undefined;
  const days = parseInt(range);
  const since = new Date();
  since.setDate(since.getDate() - days);
  return since;
}

/**
 * useTimeRange manages the state for time range filtering.
 *
 * @param defaultRange - Initial time range (defaults to "30d")
 *
 * @example
 * ```tsx
 * const { range, since, setRange } = useTimeRange();
 *
 * // Use in tRPC query
 * const { data } = trpc.metrics.getSummary.useQuery({ since });
 *
 * // Pass to filter component
 * <TimeRangeFilter value={range} onChange={setRange} />
 * ```
 */
export function useTimeRange(defaultRange: TimeRange = "30d"): UseTimeRangeReturn {
  const [range, setRangeState] = useState<TimeRange>(defaultRange);

  const since = useMemo(() => getSinceDate(range), [range]);

  const setRange = useCallback((newRange: TimeRange) => {
    setRangeState(newRange);
  }, []);

  return {
    range,
    since,
    setRange,
  };
}
