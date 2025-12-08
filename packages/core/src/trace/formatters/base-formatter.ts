/**
 * Base formatter interface and abstract class for trace output formatters
 *
 * @design-doc docs/design/core/features/trace-command.md
 * Output Formats section: lines 455-989
 * ADR: ADR-001-task-file-format (traceability patterns)
 */

import type { TraceResult } from "../types.js";

/**
 * Output format types supported by formatters
 */
export type OutputFormat = "tree" | "json" | "markdown";

/**
 * Options for formatting trace output
 */
export interface FormatOptions {
  /** Whether to use colors (for tree format) */
  color?: boolean;

  /** Indentation size (for tree/json formats) */
  indent?: number;

  /** Whether to include metadata section */
  includeMetadata?: boolean;

  /** Whether to include summary section */
  includeSummary?: boolean;
}

/**
 * Default format options
 */
export const DEFAULT_FORMAT_OPTIONS: Required<FormatOptions> = {
  color: true,
  indent: 2,
  includeMetadata: true,
  includeSummary: true,
};

/**
 * Interface for trace output formatters
 */
export interface TraceFormatter {
  /** The format type this formatter produces */
  readonly outputFormat: OutputFormat;

  /**
   * Format a TraceResult into a string
   * @param result - The trace result to format
   * @param options - Formatting options
   * @returns Formatted string output
   */
  format(result: TraceResult, options?: FormatOptions): string;
}

/**
 * Abstract base class for trace formatters
 *
 * Provides common functionality and enforces the formatter interface.
 */
export abstract class BaseTraceFormatter implements TraceFormatter {
  abstract readonly outputFormat: OutputFormat;

  /**
   * Format a TraceResult into a string
   * @param result - The trace result to format
   * @param options - Formatting options
   * @returns Formatted string output
   */
  abstract format(result: TraceResult, options?: FormatOptions): string;

  /**
   * Merge provided options with defaults
   */
  protected mergeOptions(options?: FormatOptions): Required<FormatOptions> {
    return {
      ...DEFAULT_FORMAT_OPTIONS,
      ...options,
    };
  }
}
