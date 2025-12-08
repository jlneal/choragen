/**
 * Formatter registry and factory for trace output formatters
 *
 * Provides a registry for selecting formatters by format name and a factory
 * function for creating formatter instances.
 *
 * @design-doc docs/design/core/features/trace-command.md
 * Output Formats section: lines 455-989
 * ADR: ADR-001-task-file-format (traceability patterns)
 */

// Base types and interface
export {
  BaseTraceFormatter,
  DEFAULT_FORMAT_OPTIONS,
  type FormatOptions,
  type OutputFormat,
  type TraceFormatter,
} from "./base-formatter.js";

// Formatter implementations
export { TreeFormatter } from "./tree-formatter.js";
export { JsonFormatter } from "./json-formatter.js";
export { MarkdownFormatter } from "./markdown-formatter.js";

import type { TraceFormatter, OutputFormat } from "./base-formatter.js";
import { TreeFormatter } from "./tree-formatter.js";
import { JsonFormatter } from "./json-formatter.js";
import { MarkdownFormatter } from "./markdown-formatter.js";

/**
 * Registry of available formatters by format name
 */
const formatterRegistry: Map<OutputFormat, () => TraceFormatter> = new Map([
  ["tree", () => new TreeFormatter()],
  ["json", () => new JsonFormatter()],
  ["markdown", () => new MarkdownFormatter()],
]);

/**
 * Get a formatter instance by format name
 *
 * @param format - The output format to get a formatter for
 * @returns A formatter instance for the specified format
 * @throws Error if the format is not supported
 */
export function getFormatter(format: OutputFormat): TraceFormatter {
  const factory = formatterRegistry.get(format);
  if (!factory) {
    const supported = Array.from(formatterRegistry.keys()).join(", ");
    throw new Error(
      `Unsupported format: ${format}. Supported formats: ${supported}`
    );
  }
  return factory();
}

/**
 * Check if a format is supported
 *
 * @param format - The format to check
 * @returns true if the format is supported
 */
export function isFormatSupported(format: string): format is OutputFormat {
  return formatterRegistry.has(format as OutputFormat);
}

/**
 * Get list of supported format names
 *
 * @returns Array of supported format names
 */
export function getSupportedFormats(): OutputFormat[] {
  return Array.from(formatterRegistry.keys());
}

/**
 * Register a custom formatter
 *
 * @param format - The format name to register
 * @param factory - Factory function that creates the formatter
 */
export function registerFormatter(
  format: OutputFormat,
  factory: () => TraceFormatter
): void {
  formatterRegistry.set(format, factory);
}
