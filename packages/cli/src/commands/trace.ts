/**
 * Trace command - produces traceability traces for artifacts
 *
 * @design-doc docs/design/core/features/trace-command.md
 * ADR: ADR-001-task-file-format
 */

import {
  TraceEngine,
  getFormatter,
  isFormatSupported,
  getSupportedFormats,
  type TraceConfig,
  type TraceOptions,
  type TraceDirection,
  type OutputFormat,
  type FormatOptions,
} from "@choragen/core";

/**
 * Options for the trace command
 */
export interface TraceCommandOptions {
  /** Output format: tree, json, markdown */
  format?: string;
  /** Trace direction: both, upstream, downstream */
  direction?: string;
  /** Maximum traversal depth */
  depth?: number | null;
  /** Disable ANSI colors */
  noColor?: boolean;
}

/**
 * Result from running the trace command
 */
export interface TraceCommandResult {
  success: boolean;
  output?: string;
  error?: string;
}

/**
 * Run the trace command
 *
 * @param projectRoot - Project root directory
 * @param artifactPathOrId - Path or ID of the artifact to trace
 * @param options - Command options
 * @returns Trace result with formatted output
 */
export async function runTrace(
  projectRoot: string,
  artifactPathOrId: string,
  options: TraceCommandOptions = {}
): Promise<TraceCommandResult> {
  // Validate format option
  const format = (options.format ?? "tree") as OutputFormat;
  if (!isFormatSupported(format)) {
    return {
      success: false,
      error: `Invalid format: ${format}. Supported formats: ${getSupportedFormats().join(", ")}`,
    };
  }

  // Validate direction option
  const direction = (options.direction ?? "both") as TraceDirection;
  if (!["both", "upstream", "downstream"].includes(direction)) {
    return {
      success: false,
      error: `Invalid direction: ${direction}. Must be one of: both, upstream, downstream`,
    };
  }

  // Parse depth option
  let maxDepth: number | null = null;
  if (options.depth !== undefined && options.depth !== null) {
    if (typeof options.depth !== "number" || options.depth < 1) {
      return {
        success: false,
        error: `Invalid depth: ${options.depth}. Must be a positive integer.`,
      };
    }
    maxDepth = options.depth;
  }

  // Create trace engine
  const config: TraceConfig = {
    projectRoot,
  };
  const engine = new TraceEngine(config);

  // Run trace
  const traceOptions: TraceOptions = {
    direction,
    maxDepth,
    useCache: true,
    showMissing: true,
  };

  try {
    const result = await engine.trace(artifactPathOrId, traceOptions);

    // Format output
    const formatter = getFormatter(format);
    const formatOptions: FormatOptions = {
      color: !options.noColor && process.stdout.isTTY !== false,
    };

    const output = formatter.format(result, formatOptions);

    return {
      success: true,
      output,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Format help text for the trace command
 */
export function formatTraceHelp(): string {
  return `Usage: choragen trace <artifact-path-or-id> [options]

Trace the traceability chain for an artifact.

Arguments:
  <artifact-path-or-id>    File path or artifact ID (e.g., CR-20251206-011, ADR-001)

Options:
  --format=<format>        Output format: tree, json, markdown (default: tree)
  --direction=<dir>        Trace direction: both, upstream, downstream (default: both)
  --depth=<n>              Maximum traversal depth (default: unlimited)
  --no-color               Disable ANSI colors in output

Examples:
  choragen trace packages/core/src/tasks/chain-manager.ts
  choragen trace CR-20251206-011
  choragen trace ADR-001-task-file-format --format=json
  choragen trace CHAIN-033 --format=markdown
  choragen trace packages/cli/src/cli.ts --direction=upstream --depth=3`;
}
