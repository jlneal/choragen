// ADR: ADR-011-web-api-architecture
"use client";

/**
 * Hook for fetching metrics data via tRPC
 *
 * Provides a unified interface for fetching metrics summary and events,
 * with loading and error states.
 */
import { useMemo } from "react";
import { trpc } from "@/lib/trpc/client";

/**
 * Data point for task completion chart
 * Defined locally to avoid circular dependency with @/components/metrics
 */
export interface TaskCompletionDataPoint {
  /** Date label (e.g., "Mon", "2024-01-15") */
  date: string;
  /** Number of tasks completed */
  count: number;
}

/**
 * Data point for rework trend chart
 * Defined locally to avoid circular dependency with @/components/metrics
 */
export interface ReworkTrendDataPoint {
  /** Date label (e.g., "Mon", "2024-01-15") */
  date: string;
  /** Rework rate as percentage (0-100) */
  rate: number;
}

/**
 * Return type for useMetrics hook
 */
export interface UseMetricsReturn {
  /** Combined metrics summary */
  summary: {
    tasks: {
      totalTasks: number;
      completedTasks: number;
      avgCycleTimeMs: number;
      p50CycleTimeMs: number;
      p90CycleTimeMs: number;
    };
    chains: {
      totalChains: number;
      completedChains: number;
      avgTasksPerChain: number;
    };
    rework: {
      totalReworks: number;
      reworkRate: number;
      firstTimeRightRate: number;
      avgReworkIterations: number;
    };
    eventCount: number;
  } | undefined;
  /** Task completion chart data */
  taskCompletionData: TaskCompletionDataPoint[];
  /** Rework trend chart data */
  reworkTrendData: ReworkTrendDataPoint[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: unknown;
  /** Refetch data */
  refetch: () => void;
}

/**
 * Group events by date for chart data
 */
function groupEventsByDate(
  events: Array<{ timestamp: string; eventType: string }>,
  eventType: string
): Map<string, number> {
  const grouped = new Map<string, number>();

  for (const event of events) {
    if (event.eventType !== eventType) continue;

    const date = new Date(event.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    grouped.set(date, (grouped.get(date) ?? 0) + 1);
  }

  return grouped;
}

/**
 * Calculate daily rework rates from events
 */
function calculateDailyReworkRates(
  events: Array<{ timestamp: string; eventType: string }>
): ReworkTrendDataPoint[] {
  // Group completions and reworks by date
  const completionsByDate = new Map<string, number>();
  const reworksByDate = new Map<string, number>();

  for (const event of events) {
    const date = new Date(event.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    if (event.eventType === "task:completed") {
      completionsByDate.set(date, (completionsByDate.get(date) ?? 0) + 1);
    } else if (event.eventType === "task:rework") {
      reworksByDate.set(date, (reworksByDate.get(date) ?? 0) + 1);
    }
  }

  // Calculate rate for each date with completions
  const result: ReworkTrendDataPoint[] = [];

  for (const [date, completions] of completionsByDate) {
    const reworks = reworksByDate.get(date) ?? 0;
    const rate = completions > 0 ? (reworks / completions) * 100 : 0;
    result.push({ date, rate });
  }

  return result;
}

/**
 * useMetrics fetches metrics data for the dashboard.
 *
 * @param since - Optional date to filter events from
 *
 * @example
 * ```tsx
 * const { range, since } = useTimeRange();
 * const { summary, taskCompletionData, isLoading } = useMetrics(since);
 *
 * if (isLoading) return <MetricCardSkeleton />;
 * return <MetricCard value={summary?.tasks.completedTasks ?? 0} />;
 * ```
 */
export function useMetrics(since?: Date): UseMetricsReturn {
  // Fetch summary metrics
  const summaryQuery = trpc.metrics.getSummary.useQuery(
    { since },
    {
      staleTime: 30_000, // 30 seconds
      refetchOnWindowFocus: false,
    }
  );

  // Fetch events for chart data
  const eventsQuery = trpc.metrics.getEvents.useQuery(
    { since },
    {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    }
  );

  // Transform events into chart data
  const taskCompletionData = useMemo<TaskCompletionDataPoint[]>(() => {
    if (!eventsQuery.data) return [];

    const grouped = groupEventsByDate(eventsQuery.data, "task:completed");

    // Convert to array and sort by date
    return Array.from(grouped.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => {
        // Parse dates for proper sorting
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
  }, [eventsQuery.data]);

  // Calculate rework trend data
  const reworkTrendData = useMemo<ReworkTrendDataPoint[]>(() => {
    if (!eventsQuery.data) return [];

    return calculateDailyReworkRates(eventsQuery.data).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }, [eventsQuery.data]);

  // Combined refetch function
  const refetch = () => {
    summaryQuery.refetch();
    eventsQuery.refetch();
  };

  return {
    summary: summaryQuery.data,
    taskCompletionData,
    reworkTrendData,
    isLoading: summaryQuery.isLoading || eventsQuery.isLoading,
    error: summaryQuery.error ?? eventsQuery.error ?? null,
    refetch,
  };
}
