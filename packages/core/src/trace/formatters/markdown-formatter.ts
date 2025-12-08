/**
 * Markdown formatter for trace output
 *
 * Generates documentation-ready reports with proper headings, tables, and links.
 *
 * @design-doc docs/design/core/features/trace-command.md
 * Markdown Format section: lines 826-989
 * ADR: ADR-001-task-file-format (traceability patterns)
 */

import type {
  ArtifactReference,
  ArtifactType,
  MissingLink,
  TraceNode,
  TraceResult,
} from "../types.js";
import {
  BaseTraceFormatter,
  type FormatOptions,
  type OutputFormat,
} from "./base-formatter.js";

/**
 * Map artifact types to display labels
 */
const TYPE_LABELS: Record<ArtifactType, string> = {
  request: "Requests",
  adr: "ADRs",
  design: "Design Docs",
  chain: "Chains",
  task: "Tasks",
  source: "Source Files",
  test: "Test Files",
  external: "External",
};

/**
 * Map artifact types to singular labels
 */
const TYPE_LABELS_SINGULAR: Record<ArtifactType, string> = {
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
 * Markdown formatter for trace output
 *
 * Produces documentation-ready markdown reports suitable for:
 * - Documentation generation
 * - Audit compliance reports
 * - Pull request comments
 * - Wiki pages
 *
 * @design-doc docs/design/core/features/trace-command.md lines 830-870
 */
export class MarkdownFormatter extends BaseTraceFormatter {
  readonly outputFormat: OutputFormat = "markdown";

  /**
   * Format a TraceResult as markdown
   */
  format(result: TraceResult, options?: FormatOptions): string {
    const opts = this.mergeOptions(options);
    const sections: string[] = [];

    // Header
    sections.push(this.formatHeader(result));

    // Summary section
    if (opts.includeSummary) {
      sections.push(this.formatSummarySection(result));
    }

    // Upstream trace
    if (result.upstream.length > 0) {
      sections.push(this.formatUpstreamSection(result.upstream));
    }

    // Downstream trace
    if (result.downstream.length > 0) {
      sections.push(this.formatDownstreamSection(result.downstream));
    }

    // Missing links
    if (result.missing.length > 0) {
      sections.push(this.formatMissingLinksSection(result.missing));
    } else {
      sections.push("## Missing Links\n\nNo missing links found.");
    }

    // Bidirectional link status
    sections.push(this.formatBidirectionalSection(result));

    // Metadata section
    if (opts.includeMetadata) {
      sections.push(this.formatMetadataSection(result));
    }

    return sections.join("\n\n---\n\n");
  }

  /**
   * Format the header section
   */
  private formatHeader(result: TraceResult): string {
    const { artifact, metadata } = result;
    const title = artifact.title || artifact.id;

    return [
      `# Traceability Report: ${title}`,
      "",
      `**Generated**: ${metadata.timestamp}  `,
      `**Artifact**: \`${artifact.path}\`  `,
      `**Type**: ${artifact.type}  `,
    ].join("\n");
  }

  /**
   * Format the summary section with tables
   */
  private formatSummarySection(result: TraceResult): string {
    const { summary } = result;
    const lines: string[] = [];

    lines.push("## Summary");
    lines.push("");
    lines.push("| Metric | Value |");
    lines.push("|--------|-------|");
    lines.push(`| Total Artifacts | ${summary.totalArtifacts} |`);
    lines.push(`| Missing Links | ${summary.missingCount} |`);
    lines.push(`| Incomplete Bidirectional | ${summary.incompleteBidirectional} |`);
    lines.push(`| Max Depth | ${summary.maxDepth} |`);
    lines.push("");
    lines.push("### Artifacts by Type");
    lines.push("");
    lines.push("| Type | Count |");
    lines.push("|------|-------|");

    // Show all artifact types
    const artifactTypes: ArtifactType[] = [
      "request",
      "adr",
      "design",
      "source",
      "test",
      "chain",
      "task",
      "external",
    ];

    for (const type of artifactTypes) {
      const count = summary.byType[type] || 0;
      if (count > 0 || ["request", "adr", "design", "source", "test", "chain"].includes(type)) {
        lines.push(`| ${TYPE_LABELS[type]} | ${count} |`);
      }
    }

    return lines.join("\n");
  }

  /**
   * Format the upstream trace section
   */
  private formatUpstreamSection(nodes: TraceNode[]): string {
    const lines: string[] = [];
    lines.push("## Upstream Trace (Toward Intent)");
    lines.push("");
    this.formatNodesAsMarkdown(nodes, lines, 0);
    return lines.join("\n");
  }

  /**
   * Format the downstream trace section
   */
  private formatDownstreamSection(nodes: TraceNode[]): string {
    const lines: string[] = [];
    lines.push("## Downstream Trace (Toward Verification)");
    lines.push("");
    this.formatNodesAsMarkdown(nodes, lines, 0);
    return lines.join("\n");
  }

  /**
   * Recursively format trace nodes as markdown nested list
   */
  private formatNodesAsMarkdown(
    nodes: TraceNode[],
    lines: string[],
    depth: number
  ): void {
    const indent = "  ".repeat(depth);

    for (const node of nodes) {
      const { artifact, bidirectional } = node;
      const typeLabel = TYPE_LABELS_SINGULAR[artifact.type];
      const link = this.formatArtifactLink(artifact);
      const status = this.formatBidirectionalStatus(bidirectional.status);

      lines.push(`${indent}- **${typeLabel}**: ${link} ${status}`);

      if (node.children.length > 0) {
        this.formatNodesAsMarkdown(node.children, lines, depth + 1);
      }
    }
  }

  /**
   * Format an artifact as a markdown link
   */
  private formatArtifactLink(artifact: ArtifactReference): string {
    const name = artifact.title || artifact.id;
    // Use relative path for markdown links
    return `[${name}](${artifact.path})`;
  }

  /**
   * Format bidirectional status as emoji indicator
   */
  private formatBidirectionalStatus(
    status: "complete" | "forward-only" | "reverse-only" | "missing"
  ): string {
    switch (status) {
      case "complete":
        return "✓";
      case "forward-only":
        return "⚠ forward-only";
      case "reverse-only":
        return "⚠ reverse-only";
      case "missing":
        return "❌ MISSING";
    }
  }

  /**
   * Format the missing links section as a table
   */
  private formatMissingLinksSection(missing: MissingLink[]): string {
    const lines: string[] = [];
    lines.push("## Missing Links");
    lines.push("");
    lines.push("| Expected | Type | Referenced From | Issue |");
    lines.push("|----------|------|-----------------|-------|");

    for (const link of missing) {
      const expected = link.expected.path || link.expected.id || "unknown";
      const type = link.expected.type;
      const from = link.referencedFrom.path || link.referencedFrom.id;
      const issue = link.message;
      lines.push(`| \`${expected}\` | ${type} | ${from} | ${issue} |`);
    }

    return lines.join("\n");
  }

  /**
   * Format the bidirectional link status section
   */
  private formatBidirectionalSection(result: TraceResult): string {
    const lines: string[] = [];
    lines.push("## Bidirectional Link Status");
    lines.push("");

    // Collect incomplete bidirectional links
    const incomplete: Array<{
      from: ArtifactReference;
      to: ArtifactReference;
      status: string;
      issue: string;
    }> = [];

    this.collectIncompleteBidirectional(result.upstream, incomplete);
    this.collectIncompleteBidirectional(result.downstream, incomplete);

    if (incomplete.length === 0) {
      lines.push("All bidirectional links are complete.");
      return lines.join("\n");
    }

    lines.push("| From | To | Status | Issue |");
    lines.push("|------|----|--------|-------|");

    for (const link of incomplete) {
      const from = link.from.id || link.from.path;
      const to = link.to.id || link.to.path;
      lines.push(`| ${from} | ${to} | ${link.status} | ${link.issue} |`);
    }

    return lines.join("\n");
  }

  /**
   * Recursively collect incomplete bidirectional links from nodes
   */
  private collectIncompleteBidirectional(
    nodes: TraceNode[],
    incomplete: Array<{
      from: ArtifactReference;
      to: ArtifactReference;
      status: string;
      issue: string;
    }>,
    parent?: ArtifactReference
  ): void {
    for (const node of nodes) {
      if (
        parent &&
        (node.bidirectional.status === "forward-only" ||
          node.bidirectional.status === "reverse-only")
      ) {
        incomplete.push({
          from: parent,
          to: node.artifact,
          status: node.bidirectional.status,
          issue:
            node.bidirectional.status === "forward-only"
              ? "Target doesn't link back"
              : "Only reverse link exists",
        });
      }

      if (node.children.length > 0) {
        this.collectIncompleteBidirectional(
          node.children,
          incomplete,
          node.artifact
        );
      }
    }
  }

  /**
   * Format the metadata section
   */
  private formatMetadataSection(result: TraceResult): string {
    const { metadata } = result;
    const lines: string[] = [];

    lines.push("## Trace Metadata");
    lines.push("");
    lines.push(`- **Direction**: ${metadata.direction}`);
    lines.push(
      `- **Max Depth**: ${metadata.maxDepth === null ? "unlimited" : metadata.maxDepth}`
    );
    lines.push(`- **Cached**: ${metadata.cached ? "Yes" : "No"}`);
    lines.push(`- **Duration**: ${metadata.durationMs}ms`);

    return lines.join("\n");
  }
}
