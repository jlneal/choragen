/**
 * Pipeline metrics module
 *
 * Exports types and constants for tracking pipeline events.
 *
 * ADR: ADR-004-pipeline-metrics
 */

export type {
  EventType,
  EntityType,
  TokenUsage,
  AgentInfo,
  PipelineEvent,
  MetricsAggregate,
  MetricsConfig,
} from "./types.js";

export {
  EVENTS_LOG_PATH,
  AGGREGATES_PATH,
  METRICS_DIR,
  DEFAULT_METRICS_CONFIG,
  EMPTY_AGGREGATES,
} from "./types.js";
