// ADR: ADR-011-web-api-architecture

/**
 * Metric components for the web dashboard
 *
 * These components are used to display KPIs and metrics with trend indicators.
 */

export { MetricCard, type MetricTrend } from "./metric-card";
export { TrendIndicator, type TrendDirection } from "./trend-indicator";
export { MetricCardSkeleton } from "./metric-card-skeleton";

// Chart components
export { ChartContainer } from "./chart-container";
export { ChartSkeleton } from "./chart-skeleton";
export { TaskCompletionChart } from "./task-completion-chart";
export { ReworkTrendChart } from "./rework-trend-chart";
// Re-export types from hooks for backward compatibility
export type { TaskCompletionDataPoint, ReworkTrendDataPoint } from "@/hooks";

// Filter components
export { TimeRangeFilter } from "./time-range-filter";

// Table components
export {
  SessionsTable,
  type SessionData,
  type SessionStatus,
} from "./sessions-table";
export { SessionsTableSkeleton } from "./sessions-table-skeleton";
