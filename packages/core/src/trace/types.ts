/**
 * Traceability types for the trace command
 *
 * @design-doc docs/design/core/features/trace-command.md
 * ADR: ADR-001-task-file-format (traceability patterns)
 */

/**
 * Supported artifact types in the traceability chain
 */
export type ArtifactType =
  | "request" // CR or FR
  | "adr" // Architecture Decision Record
  | "design" // Design document
  | "chain" // Task chain
  | "task" // Individual task
  | "source" // Source file
  | "test" // Test file
  | "external"; // External reference (GitHub issue, etc.)

/**
 * Type of relationship between artifacts
 */
export type LinkRelationship =
  | "implements" // Source implements ADR
  | "tests" // Test verifies source
  | "references" // General reference
  | "derives-from" // ADR derives from CR/FR
  | "consumes" // File imports/uses another
  | "documents" // Design doc documents feature
  | "governs"; // ADR governs implementation

/**
 * Reference to an artifact in the system
 */
export interface ArtifactReference {
  /** Artifact type */
  type: ArtifactType;

  /** Artifact identifier (e.g., "ADR-001", "CR-20251206-011") */
  id: string;

  /** File path relative to project root */
  path: string;

  /** Human-readable title (if available) */
  title?: string;
}

/**
 * Bidirectional link verification status
 */
export interface BidirectionalStatus {
  /** Forward link exists (A → B) */
  forward: boolean;

  /** Reverse link exists (B → A) */
  reverse: boolean;

  /** Overall status */
  status: "complete" | "forward-only" | "reverse-only" | "missing";
}

/**
 * Node in the trace tree
 */
export interface TraceNode {
  /** The artifact at this node */
  artifact: ArtifactReference;

  /** Relationship to parent */
  relationship: LinkRelationship;

  /** Bidirectional link status */
  bidirectional: BidirectionalStatus;

  /** Child nodes (further links from this artifact) */
  children: TraceNode[];
}

/**
 * Information about a missing or broken link
 */
export interface MissingLink {
  /** Type of issue */
  type: "missing" | "broken" | "external";

  /** The artifact that should exist */
  expected: {
    type: ArtifactType;
    id?: string;
    path?: string;
  };

  /** Where the reference was found */
  referencedFrom: ArtifactReference;

  /** Human-readable description of the issue */
  message: string;
}

/**
 * Summary statistics for the trace
 */
export interface TraceSummary {
  /** Total artifacts discovered */
  totalArtifacts: number;

  /** Count by artifact type */
  byType: Record<ArtifactType, number>;

  /** Number of missing links */
  missingCount: number;

  /** Number of incomplete bidirectional links */
  incompleteBidirectional: number;

  /** Maximum depth reached */
  maxDepth: number;
}

/**
 * Metadata about the trace operation
 */
export interface TraceMetadata {
  /** When the trace was performed */
  timestamp: string; // ISO 8601

  /** Trace direction used */
  direction: TraceDirection;

  /** Maximum depth setting (null = unlimited) */
  maxDepth: number | null;

  /** Whether cache was used */
  cached: boolean;

  /** Trace duration in milliseconds */
  durationMs: number;
}

/**
 * Complete trace result structure
 */
export interface TraceResult {
  /** The starting artifact */
  artifact: ArtifactReference;

  /** Upstream links (toward intent: source → ADR → design → CR/FR) */
  upstream: TraceNode[];

  /** Downstream links (toward verification: CR/FR → design → ADR → source → tests) */
  downstream: TraceNode[];

  /** All missing or broken links discovered */
  missing: MissingLink[];

  /** Summary statistics */
  summary: TraceSummary;

  /** Trace metadata */
  metadata: TraceMetadata;
}

/**
 * Trace direction options
 */
export type TraceDirection = "both" | "upstream" | "downstream";

/**
 * Options for the trace operation
 */
export interface TraceOptions {
  /** Trace direction */
  direction?: TraceDirection;

  /** Maximum traversal depth (null = unlimited) */
  maxDepth?: number | null;

  /** Whether to use cache */
  useCache?: boolean;

  /** Whether to show missing links */
  showMissing?: boolean;
}

/**
 * Configuration for the TraceEngine
 */
export interface TraceConfig {
  /** Project root directory */
  projectRoot: string;

  /** Paths to search for artifacts */
  artifactPaths?: {
    requests?: string;
    adrs?: string;
    design?: string;
    tasks?: string;
    source?: string[];
  };

  /** Cache TTL in milliseconds */
  cacheTtlMs?: number;
}

/**
 * Default trace configuration
 */
export const DEFAULT_TRACE_CONFIG: Required<Omit<TraceConfig, "projectRoot">> =
  {
    artifactPaths: {
      requests: "docs/requests",
      adrs: "docs/adr",
      design: "docs/design",
      tasks: "docs/tasks",
      source: ["packages/*/src"],
    },
    cacheTtlMs: 60000, // 1 minute
  };

/**
 * Default trace options
 */
export const DEFAULT_TRACE_OPTIONS: Required<TraceOptions> = {
  direction: "both",
  maxDepth: null,
  useCache: true,
  showMissing: true,
};
