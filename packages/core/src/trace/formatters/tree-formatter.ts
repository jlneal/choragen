/**
 * Tree formatter for trace output
 *
 * Produces human-readable hierarchical output using Unicode box-drawing characters
 * and ANSI colors for terminal display.
 *
 * @design-doc docs/design/core/features/trace-command.md
 * Tree Format section: lines 459-523
 * ADR: ADR-001-task-file-format (traceability patterns)
 */

import type {
  ArtifactReference,
  ArtifactType,
  TraceNode,
  TraceResult,
} from "../types.js";
import {
  BaseTraceFormatter,
  type FormatOptions,
  type OutputFormat,
} from "./base-formatter.js";

/**
 * Box-drawing symbols for tree structure
 * @design-doc docs/design/core/features/trace-command.md lines 463-471
 */
const TREE_SYMBOLS = {
  /** Branch with siblings below */
  BRANCH: "├──",
  /** Last branch at current level */
  LAST_BRANCH: "└──",
  /** Vertical continuation line */
  VERTICAL: "│",
  /** Indentation (3 spaces per level) */
  INDENT: "   ",
} as const;

/**
 * ANSI color codes for terminal output
 * @design-doc docs/design/core/features/trace-command.md lines 473-482
 */
const ANSI_COLORS = {
  /** Artifact type labels (ADR:, CR:, Design:) */
  CYAN: "\x1b[36m",
  /** Found/complete status, checkmarks */
  GREEN: "\x1b[32m",
  /** Warnings, forward-only links */
  YELLOW: "\x1b[33m",
  /** Missing/broken links, errors */
  RED: "\x1b[31m",
  /** Secondary info (paths, hints) */
  DIM: "\x1b[2m",
  /** Reset to default */
  RESET: "\x1b[0m",
} as const;

/**
 * Map artifact types to display labels
 */
const TYPE_LABELS: Record<ArtifactType, string> = {
  request: "Request",
  adr: "ADR",
  design: "Design",
  chain: "Chain",
  task: "Task",
  source: "Source",
  test: "Test",
  external: "External",
};

/**
 * Tree formatter for trace output
 *
 * Produces human-readable hierarchical output using Unicode box-drawing characters
 * and optional ANSI colors for terminal display.
 */
export class TreeFormatter extends BaseTraceFormatter {
  readonly outputFormat: OutputFormat = "tree";

  /**
   * Format a TraceResult as a tree structure
   */
  format(result: TraceResult, options?: FormatOptions): string {
    const opts = this.mergeOptions(options);
    const useColor = opts.color && this.isTTY();
    const lines: string[] = [];

    // Header
    lines.push(this.formatHeader(result.artifact, useColor));
    lines.push("");

    // Upstream trace
    if (result.upstream.length > 0) {
      lines.push(this.colorize("UPSTREAM (toward intent):", useColor, "CYAN"));
      this.formatNodes(result.upstream, lines, "", useColor);
      lines.push("");
    }

    // Downstream trace
    if (result.downstream.length > 0) {
      lines.push(
        this.colorize("DOWNSTREAM (toward verification):", useColor, "CYAN")
      );
      this.formatNodes(result.downstream, lines, "", useColor);
      lines.push("");
    }

    // Summary section
    if (opts.includeSummary) {
      lines.push(this.formatSummary(result, useColor));
    }

    return lines.join("\n");
  }

  /**
   * Format the header line
   */
  private formatHeader(artifact: ArtifactReference, useColor: boolean): string {
    const title = artifact.title || artifact.id;
    return `Traceability for: ${this.colorize(title, useColor, "CYAN")}`;
  }

  /**
   * Recursively format trace nodes as tree branches
   */
  private formatNodes(
    nodes: TraceNode[],
    lines: string[],
    prefix: string,
    useColor: boolean
  ): void {
    nodes.forEach((node, index) => {
      const isLast = index === nodes.length - 1;
      const branch = isLast ? TREE_SYMBOLS.LAST_BRANCH : TREE_SYMBOLS.BRANCH;
      const childPrefix = isLast
        ? prefix + TREE_SYMBOLS.INDENT
        : prefix + TREE_SYMBOLS.VERTICAL + "  ";

      // Format the node line
      const nodeLine = this.formatNode(node, useColor);
      lines.push(`${prefix}${branch} ${nodeLine}`);

      // Add hint for incomplete bidirectional links
      if (node.bidirectional.status === "forward-only") {
        const hint = this.colorize(
          "(links to target, but target doesn't link back)",
          useColor,
          "DIM"
        );
        lines.push(`${childPrefix}${hint}`);
      }

      // Recursively format children
      if (node.children.length > 0) {
        this.formatNodes(node.children, lines, childPrefix, useColor);
      }
    });
  }

  /**
   * Format a single trace node
   */
  private formatNode(node: TraceNode, useColor: boolean): string {
    const { artifact, bidirectional } = node;
    const typeLabel = TYPE_LABELS[artifact.type];
    const label = this.colorize(`${typeLabel}:`, useColor, "CYAN");
    const name = artifact.title || artifact.id;

    // Status indicator
    let status = "";
    switch (bidirectional.status) {
      case "complete":
        status = this.colorize(" [bidirectional ✓]", useColor, "GREEN");
        break;
      case "forward-only":
        status = this.colorize(" [forward-only ⚠]", useColor, "YELLOW");
        break;
      case "reverse-only":
        status = this.colorize(" [reverse-only ⚠]", useColor, "YELLOW");
        break;
      case "missing":
        status = this.colorize(" [MISSING]", useColor, "RED");
        break;
    }

    return `${label} ${name}${status}`;
  }

  /**
   * Format the summary section
   */
  private formatSummary(result: TraceResult, useColor: boolean): string {
    const { summary } = result;
    const lines: string[] = [];

    lines.push("Summary:");
    lines.push(`  Total artifacts: ${summary.totalArtifacts}`);

    if (summary.missingCount > 0) {
      const missing = this.colorize(
        `Missing links: ${summary.missingCount}`,
        useColor,
        "RED"
      );
      lines.push(`  ${missing}`);
    } else {
      lines.push(`  Missing links: 0`);
    }

    if (summary.incompleteBidirectional > 0) {
      const incomplete = this.colorize(
        `Incomplete bidirectional: ${summary.incompleteBidirectional}`,
        useColor,
        "YELLOW"
      );
      lines.push(`  ${incomplete}`);
    } else {
      lines.push(`  Incomplete bidirectional: 0`);
    }

    return lines.join("\n");
  }

  /**
   * Apply ANSI color code to text
   */
  private colorize(
    text: string,
    useColor: boolean,
    color: keyof typeof ANSI_COLORS
  ): string {
    if (!useColor) return text;
    return `${ANSI_COLORS[color]}${text}${ANSI_COLORS.RESET}`;
  }

  /**
   * Detect if output is a TTY (terminal)
   * Colors are disabled when output is piped
   */
  private isTTY(): boolean {
    // Check for NO_COLOR environment variable (standard)
    if (typeof process !== "undefined" && process.env?.NO_COLOR !== undefined) {
      return false;
    }
    // Check if stdout is a TTY
    if (typeof process !== "undefined" && process.stdout?.isTTY) {
      return true;
    }
    // Default to no color in non-TTY environments
    return false;
  }
}
