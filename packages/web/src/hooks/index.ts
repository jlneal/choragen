// ADR: ADR-011-web-api-architecture

/**
 * Custom hooks for the web dashboard
 */

export { useTaskDetail, type UseTaskDetailReturn, type TaskDetailState } from "./use-task-detail";
export {
  useTimeRange,
  type TimeRange,
  type UseTimeRangeReturn,
  TIME_RANGE_OPTIONS,
} from "./use-time-range";
export { useMetrics, type UseMetricsReturn } from "./use-metrics";
export {
  useSessionFilters,
  type UseSessionFiltersState,
  type UseSessionFiltersReturn,
} from "./use-session-filters";
