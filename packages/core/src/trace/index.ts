/**
 * Traceability module for @choragen/core
 *
 * Provides the TraceEngine for walking traceability chains across the codebase.
 *
 * @design-doc docs/design/core/features/trace-command.md
 * ADR: ADR-001-task-file-format (traceability patterns)
 */

// Types
export type {
  ArtifactReference,
  ArtifactType,
  BidirectionalStatus,
  LinkRelationship,
  MissingLink,
  TraceConfig,
  TraceDirection,
  TraceMetadata,
  TraceNode,
  TraceOptions,
  TraceResult,
  TraceSummary,
} from "./types.js";

export { DEFAULT_TRACE_CONFIG, DEFAULT_TRACE_OPTIONS } from "./types.js";

// Cache
export { TraceCache, type DiscoveredLinks } from "./cache.js";

// Engine
export { TraceEngine } from "./trace-engine.js";

// Parsers
export {
  // Registry
  ParserRegistry,
  getParserRegistry,
  createParserRegistry,
  parseLinks,
  inferArtifactType,
  createParseContext,
  // Base types
  type LinkParser,
  type ParseContext,
  type ParseResult,
  BaseLinkParser,
  // Individual parsers
  SourceParser,
  AdrParser,
  RequestParser,
  DesignParser,
  ChainParser,
  // Patterns
  ADR_COMMENT_PATTERN,
  ADR_PATH_PATTERN,
  ADR_ID_PATTERN,
  CR_ID_PATTERN,
  FR_ID_PATTERN,
  LINKED_CR_FR_PATTERN,
  REQUEST_ID_PATTERN,
  DESIGN_DOC_PATH_PATTERN,
  DESIGN_DOC_TAG_PATTERN,
  LINKED_DESIGN_DOCS_PATTERN,
  CHAIN_ID_PATTERN,
  CHAIN_METADATA_PATTERN,
  TASK_ID_PATTERN,
  IMPORT_PATTERN,
  REQUIRE_PATTERN,
  DYNAMIC_IMPORT_PATTERN,
  MARKDOWN_LINK_PATTERN,
  DOCS_LINK_PATTERN,
  IMPLEMENTATION_SECTION_PATTERN,
  LINKED_ADRS_SECTION_PATTERN,
  LINKED_REQUEST_SECTION_PATTERN,
  freshPattern,
  extractMatches,
  extractCaptureGroups,
} from "./parsers/index.js";

// Formatters
export {
  // Base types and interface
  BaseTraceFormatter,
  DEFAULT_FORMAT_OPTIONS,
  type FormatOptions,
  type OutputFormat,
  type TraceFormatter,
  // Formatter implementations
  TreeFormatter,
  JsonFormatter,
  MarkdownFormatter,
  // Registry functions
  getFormatter,
  isFormatSupported,
  getSupportedFormats,
  registerFormatter,
} from "./formatters/index.js";
