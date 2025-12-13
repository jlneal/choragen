/**
 * Pipeline metrics type definitions
 *
 * Types for tracking pipeline events, token usage, and agent activity.
 * Events are stored in append-only JSONL format for analysis.
 *
 * ADR: ADR-004-pipeline-metrics
 */

/**
 * Event types for pipeline tracking
 */
export type EventType =
  | "task:started"
  | "task:submitted"
  | "task:approved"
  | "task:changes_requested"
  | "task:completed"
  | "task:rework"
  | "chain:created"
  | "chain:completed"
  | "chain:approved"
  | "chain:changes_requested"
  | "request:created"
  | "request:closed"
  | "request:approved"
  | "request:changes_requested";

/**
 * Entity types that can emit events
 */
export type EntityType = "task" | "chain" | "request";

/**
 * Token usage for a single event
 */
export interface TokenUsage {
  /** Input tokens consumed */
  input: number;
  /** Output tokens generated */
  output: number;
}

/**
 * Information about the agent that triggered an event
 */
export interface AgentInfo {
  /** Agent identifier (e.g., "impl", "control") */
  role: string;
  /** Model used (e.g., "claude-3.5-sonnet") */
  model?: string;
  /** Session or conversation ID */
  sessionId?: string;
}

/**
 * A single pipeline event
 *
 * Events are immutable records of pipeline activity.
 * They are stored in append-only JSONL format.
 */
export interface PipelineEvent {
  /** Unique event identifier (UUID) */
  id: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Type of event */
  eventType: EventType;
  /** Type of entity that emitted the event */
  entityType: EntityType;
  /** ID of the entity (task ID, chain ID, or request ID) */
  entityId: string;
  /** Parent chain ID (for task events) */
  chainId?: string;
  /** Parent request ID (for chain/task events) */
  requestId?: string;
  /** Model used for this event */
  model?: string;
  /** Token usage for this event */
  tokens?: TokenUsage;
  /** Additional event-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Aggregated metrics (optional cache)
 */
export interface MetricsAggregate {
  /** Version for future compatibility */
  version: 1;
  /** Last updated timestamp */
  lastUpdated: string;
  /** Total events processed */
  totalEvents: number;
  /** Events by type */
  eventsByType: Record<EventType, number>;
  /** Total token usage */
  totalTokens: {
    input: number;
    output: number;
  };
  /** Tokens by model */
  tokensByModel: Record<string, TokenUsage>;
}

// ============================================================================
// Storage Paths
// ============================================================================

/**
 * Default path for the events log file (JSONL format)
 */
export const EVENTS_LOG_PATH = ".choragen/metrics/events.jsonl";

/**
 * Default path for the aggregates cache file
 */
export const AGGREGATES_PATH = ".choragen/metrics/aggregates.json";

/**
 * Metrics directory path
 */
export const METRICS_DIR = ".choragen/metrics";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Metrics configuration options
 */
export interface MetricsConfig {
  /** Path to the events log file */
  eventsLogPath: string;
  /** Path to the aggregates cache file */
  aggregatesPath: string;
  /** Whether to auto-update aggregates on each event */
  autoAggregate: boolean;
}

/**
 * Default metrics configuration
 */
export const DEFAULT_METRICS_CONFIG: MetricsConfig = {
  eventsLogPath: EVENTS_LOG_PATH,
  aggregatesPath: AGGREGATES_PATH,
  autoAggregate: false,
};

// ============================================================================
// Empty/Initial Values
// ============================================================================

/**
 * Empty aggregates object for initialization
 */
export const EMPTY_AGGREGATES: MetricsAggregate = {
  version: 1,
  lastUpdated: new Date().toISOString(),
  totalEvents: 0,
  eventsByType: {
    "task:started": 0,
    "task:submitted": 0,
    "task:approved": 0,
    "task:changes_requested": 0,
    "task:completed": 0,
    "task:rework": 0,
    "chain:created": 0,
    "chain:completed": 0,
    "chain:approved": 0,
    "chain:changes_requested": 0,
    "request:created": 0,
    "request:closed": 0,
    "request:approved": 0,
    "request:changes_requested": 0,
  },
  totalTokens: {
    input: 0,
    output: 0,
  },
  tokensByModel: {},
};
