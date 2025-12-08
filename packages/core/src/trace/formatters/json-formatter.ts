/**
 * JSON formatter for trace output
 *
 * Serializes TraceResult to JSON for machine-readable output and tooling integration.
 *
 * @design-doc docs/design/core/features/trace-command.md
 * JSON Format section: lines 524-825
 * ADR: ADR-001-task-file-format (traceability patterns)
 */

import type { TraceResult } from "../types.js";
import {
  BaseTraceFormatter,
  type FormatOptions,
  type OutputFormat,
} from "./base-formatter.js";

/**
 * JSON formatter for trace output
 *
 * Produces machine-readable JSON output suitable for:
 * - CI/CD pipeline integration
 * - Building dashboards
 * - IDE integration
 * - Programmatic access to trace data
 */
export class JsonFormatter extends BaseTraceFormatter {
  readonly outputFormat: OutputFormat = "json";

  /**
   * Format a TraceResult as JSON
   */
  format(result: TraceResult, options?: FormatOptions): string {
    const opts = this.mergeOptions(options);
    return JSON.stringify(result, null, opts.indent);
  }
}
