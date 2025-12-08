/**
 * @design-doc docs/design/core/features/trace-command.md
 * @test-type unit
 * @user-intent "Verify markdown formatter produces documentation-ready reports with proper structure"
 *
 * Tests for the MarkdownFormatter that produces documentation-ready trace output.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { MarkdownFormatter } from "../../formatters/markdown-formatter.js";
import type { TraceResult, TraceNode, ArtifactReference } from "../../types.js";

describe("MarkdownFormatter", () => {
  let formatter: MarkdownFormatter;

  beforeEach(() => {
    formatter = new MarkdownFormatter();
  });

  // Test fixtures
  const createArtifact = (
    type: ArtifactReference["type"],
    id: string,
    title?: string
  ): ArtifactReference => ({
    type,
    id,
    path: `path/to/${id}`,
    title,
  });

  const createNode = (
    artifact: ArtifactReference,
    status: "complete" | "forward-only" | "reverse-only" | "missing" = "complete",
    children: TraceNode[] = []
  ): TraceNode => ({
    artifact,
    relationship: "references",
    bidirectional: {
      forward: status !== "missing" && status !== "reverse-only",
      reverse: status === "complete" || status === "reverse-only",
      status,
    },
    children,
  });

  const createTraceResult = (
    artifact: ArtifactReference,
    upstream: TraceNode[] = [],
    downstream: TraceNode[] = []
  ): TraceResult => ({
    artifact,
    upstream,
    downstream,
    missing: [],
    summary: {
      totalArtifacts: 1 + upstream.length + downstream.length,
      byType: {
        request: 0,
        adr: 0,
        design: 0,
        chain: 0,
        task: 0,
        source: 0,
        test: 0,
        external: 0,
      },
      missingCount: 0,
      incompleteBidirectional: 0,
      maxDepth: 1,
    },
    metadata: {
      timestamp: "2025-12-08T00:00:00.000Z",
      direction: "both",
      maxDepth: null,
      cached: false,
      durationMs: 10,
    },
  });

  describe("outputFormat", () => {
    it("reports markdown as output format", () => {
      expect(formatter.outputFormat).toBe("markdown");
    });
  });

  describe("header section", () => {
    it("includes title with artifact name", () => {
      const artifact = createArtifact("source", "engine.ts", "TraceEngine");
      const result = createTraceResult(artifact);

      const output = formatter.format(result);

      expect(output).toContain("# Traceability Report: TraceEngine");
    });

    it("uses artifact ID when title is not available", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);

      const output = formatter.format(result);

      expect(output).toContain("# Traceability Report: engine.ts");
    });

    it("includes generated timestamp", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);

      const output = formatter.format(result);

      expect(output).toContain("**Generated**:");
      expect(output).toContain("2025-12-08");
    });

    it("includes artifact path", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);

      const output = formatter.format(result);

      expect(output).toContain("**Artifact**: `path/to/engine.ts`");
    });

    it("includes artifact type", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);

      const output = formatter.format(result);

      expect(output).toContain("**Type**: source");
    });
  });

  describe("summary section", () => {
    it("includes summary table when option is true", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);

      const output = formatter.format(result, { includeSummary: true });

      expect(output).toContain("## Summary");
      expect(output).toContain("| Metric | Value |");
      expect(output).toContain("| Total Artifacts |");
    });

    it("excludes summary when option is false", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);

      const output = formatter.format(result, { includeSummary: false });

      expect(output).not.toContain("## Summary");
    });

    it("shows artifacts by type table", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);
      result.summary.byType = {
        request: 1,
        adr: 2,
        design: 1,
        chain: 0,
        task: 0,
        source: 3,
        test: 2,
        external: 0,
      };

      const output = formatter.format(result, { includeSummary: true });

      expect(output).toContain("### Artifacts by Type");
      expect(output).toContain("| Requests | 1 |");
      expect(output).toContain("| ADRs | 2 |");
      expect(output).toContain("| Source Files | 3 |");
    });

    it("shows missing links count", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);
      result.summary.missingCount = 5;

      const output = formatter.format(result, { includeSummary: true });

      expect(output).toContain("| Missing Links | 5 |");
    });

    it("shows max depth", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);
      result.summary.maxDepth = 4;

      const output = formatter.format(result, { includeSummary: true });

      expect(output).toContain("| Max Depth | 4 |");
    });
  });

  describe("upstream trace section", () => {
    it("includes upstream section when nodes exist", () => {
      const artifact = createArtifact("source", "engine.ts");
      const adrNode = createNode(createArtifact("adr", "ADR-001", "Task Format"));
      const result = createTraceResult(artifact, [adrNode]);

      const output = formatter.format(result);

      expect(output).toContain("## Upstream Trace (Toward Intent)");
    });

    it("excludes upstream section when empty", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);

      const output = formatter.format(result);

      expect(output).not.toContain("## Upstream Trace");
    });

    it("formats nodes as markdown links", () => {
      const artifact = createArtifact("source", "engine.ts");
      const adrNode = createNode(createArtifact("adr", "ADR-001", "Task Format"));
      const result = createTraceResult(artifact, [adrNode]);

      const output = formatter.format(result);

      expect(output).toContain("[Task Format](path/to/ADR-001)");
    });

    it("shows type labels", () => {
      const artifact = createArtifact("source", "engine.ts");
      const adrNode = createNode(createArtifact("adr", "ADR-001", "ADR"));
      const result = createTraceResult(artifact, [adrNode]);

      const output = formatter.format(result);

      expect(output).toContain("**ADR**:");
    });

    it("shows bidirectional status indicators", () => {
      const artifact = createArtifact("source", "engine.ts");
      const completeNode = createNode(
        createArtifact("adr", "ADR-001", "Complete"),
        "complete"
      );
      const forwardOnlyNode = createNode(
        createArtifact("adr", "ADR-002", "Forward"),
        "forward-only"
      );
      const result = createTraceResult(artifact, [completeNode, forwardOnlyNode]);

      const output = formatter.format(result);

      expect(output).toContain("✓");
      expect(output).toContain("⚠ forward-only");
    });

    it("formats nested nodes with indentation", () => {
      const artifact = createArtifact("source", "engine.ts");
      const requestNode = createNode(createArtifact("request", "CR-001", "CR"));
      const adrNode = createNode(
        createArtifact("adr", "ADR-001", "ADR"),
        "complete",
        [requestNode]
      );
      const result = createTraceResult(artifact, [adrNode]);

      const output = formatter.format(result);

      // Should have nested list items
      expect(output).toContain("- **ADR**:");
      expect(output).toContain("  - **Request**:");
    });
  });

  describe("downstream trace section", () => {
    it("includes downstream section when nodes exist", () => {
      const artifact = createArtifact("source", "engine.ts");
      const testNode = createNode(createArtifact("test", "engine.test.ts", "Tests"));
      const result = createTraceResult(artifact, [], [testNode]);

      const output = formatter.format(result);

      expect(output).toContain("## Downstream Trace (Toward Verification)");
    });

    it("excludes downstream section when empty", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);

      const output = formatter.format(result);

      expect(output).not.toContain("## Downstream Trace");
    });
  });

  describe("missing links section", () => {
    it("shows missing links table when present", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);
      result.missing = [
        {
          type: "missing",
          expected: {
            type: "adr",
            id: "ADR-999",
            path: "docs/adr/done/ADR-999.md",
          },
          referencedFrom: artifact,
          message: "Referenced artifact not found",
        },
      ];

      const output = formatter.format(result);

      expect(output).toContain("## Missing Links");
      expect(output).toContain("| Expected | Type | Referenced From | Issue |");
      expect(output).toContain("ADR-999");
      expect(output).toContain("Referenced artifact not found");
    });

    it("shows no missing links message when empty", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);

      const output = formatter.format(result);

      expect(output).toContain("## Missing Links");
      expect(output).toContain("No missing links found");
    });
  });

  describe("bidirectional link status section", () => {
    it("shows complete message when all links are bidirectional", () => {
      const artifact = createArtifact("source", "engine.ts");
      const completeNode = createNode(
        createArtifact("adr", "ADR-001", "ADR"),
        "complete"
      );
      const result = createTraceResult(artifact, [completeNode]);

      const output = formatter.format(result);

      expect(output).toContain("## Bidirectional Link Status");
      expect(output).toContain("All bidirectional links are complete");
    });

    it("shows table for incomplete bidirectional links", () => {
      const artifact = createArtifact("source", "engine.ts");
      // Create a nested structure where the child has forward-only status
      // The collectIncompleteBidirectional function needs a parent to track
      const childNode = createNode(
        createArtifact("request", "CR-001", "CR"),
        "forward-only"
      );
      const parentNode = createNode(
        createArtifact("adr", "ADR-001", "ADR"),
        "complete",
        [childNode]
      );
      const result = createTraceResult(artifact, [parentNode]);

      const output = formatter.format(result);

      expect(output).toContain("## Bidirectional Link Status");
      // Table headers should appear when there are incomplete links with parents
      expect(output).toContain("| From | To | Status | Issue |");
    });
  });

  describe("metadata section", () => {
    it("includes metadata when option is true", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);

      const output = formatter.format(result, { includeMetadata: true });

      expect(output).toContain("## Trace Metadata");
      expect(output).toContain("**Direction**:");
      expect(output).toContain("**Max Depth**:");
      expect(output).toContain("**Cached**:");
      expect(output).toContain("**Duration**:");
    });

    it("excludes metadata when option is false", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);

      const output = formatter.format(result, { includeMetadata: false });

      expect(output).not.toContain("## Trace Metadata");
    });

    it("shows unlimited for null maxDepth", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);
      result.metadata.maxDepth = null;

      const output = formatter.format(result, { includeMetadata: true });

      expect(output).toContain("**Max Depth**: unlimited");
    });

    it("shows numeric maxDepth when set", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);
      result.metadata.maxDepth = 5;

      const output = formatter.format(result, { includeMetadata: true });

      expect(output).toContain("**Max Depth**: 5");
    });

    it("shows cached status", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);
      result.metadata.cached = true;

      const output = formatter.format(result, { includeMetadata: true });

      expect(output).toContain("**Cached**: Yes");
    });

    it("shows duration in milliseconds", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);
      result.metadata.durationMs = 42;

      const output = formatter.format(result, { includeMetadata: true });

      expect(output).toContain("**Duration**: 42ms");
    });
  });

  describe("section separators", () => {
    it("uses horizontal rules between sections", () => {
      const artifact = createArtifact("source", "engine.ts");
      const adrNode = createNode(createArtifact("adr", "ADR-001", "ADR"));
      const result = createTraceResult(artifact, [adrNode]);

      const output = formatter.format(result);

      expect(output).toContain("---");
    });
  });

  describe("edge cases", () => {
    it("handles empty upstream and downstream", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);

      const output = formatter.format(result);

      expect(output).toContain("# Traceability Report");
      expect(output).not.toContain("## Upstream Trace");
      expect(output).not.toContain("## Downstream Trace");
    });

    it("handles deeply nested structures", () => {
      const artifact = createArtifact("source", "engine.ts");

      // Create 5-level deep tree
      let deepNode = createNode(createArtifact("request", "CR-001", "Level 5"));
      for (let i = 4; i >= 1; i--) {
        deepNode = createNode(
          createArtifact("adr", `ADR-00${i}`, `Level ${i}`),
          "complete",
          [deepNode]
        );
      }

      const result = createTraceResult(artifact, [deepNode]);

      const output = formatter.format(result);

      // Should have increasing indentation
      expect(output).toContain("- **ADR**: [Level 1]");
      expect(output).toContain("  - **ADR**: [Level 2]");
      expect(output).toContain("    - **ADR**: [Level 3]");
    });

    it("handles special characters in titles", () => {
      const artifact = createArtifact(
        "source",
        "engine.ts",
        "Title with | pipe and [brackets]"
      );
      const result = createTraceResult(artifact);

      const output = formatter.format(result);

      // Should still produce valid markdown
      expect(output).toContain("Title with | pipe and [brackets]");
    });

    it("handles all artifact type labels", () => {
      const artifact = createArtifact("source", "engine.ts");
      const nodes = [
        createNode(createArtifact("request", "CR-001", "Request")),
        createNode(createArtifact("adr", "ADR-001", "ADR")),
        createNode(createArtifact("design", "design.md", "Design")),
        createNode(createArtifact("chain", "CHAIN-001", "Chain")),
        createNode(createArtifact("task", "task-001", "Task")),
        createNode(createArtifact("source", "source.ts", "Source")),
        createNode(createArtifact("test", "test.ts", "Test")),
        createNode(createArtifact("external", "ext", "External")),
      ];
      const result = createTraceResult(artifact, nodes);

      const output = formatter.format(result);

      expect(output).toContain("**Request**:");
      expect(output).toContain("**ADR**:");
      expect(output).toContain("**Design**:");
      expect(output).toContain("**Chain**:");
      expect(output).toContain("**Task**:");
      expect(output).toContain("**Source**:");
      expect(output).toContain("**Test**:");
      expect(output).toContain("**External**:");
    });
  });
});
