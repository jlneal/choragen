/**
 * @design-doc docs/design/core/features/trace-command.md
 * @test-type unit
 * @user-intent "Verify JSON formatter produces valid, parseable JSON output"
 *
 * Tests for the JsonFormatter that produces machine-readable trace output.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { JsonFormatter } from "../../formatters/json-formatter.js";
import type { TraceResult, TraceNode, ArtifactReference } from "../../types.js";

describe("JsonFormatter", () => {
  let formatter: JsonFormatter;

  beforeEach(() => {
    formatter = new JsonFormatter();
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
    children: TraceNode[] = []
  ): TraceNode => ({
    artifact,
    relationship: "references",
    bidirectional: {
      forward: true,
      reverse: true,
      status: "complete",
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
    it("reports json as output format", () => {
      expect(formatter.outputFormat).toBe("json");
    });
  });

  describe("format", () => {
    it("produces valid JSON", () => {
      const artifact = createArtifact("source", "index.ts", "Main Entry");
      const result = createTraceResult(artifact);

      const output = formatter.format(result);

      expect(() => JSON.parse(output)).not.toThrow();
    });

    it("preserves all TraceResult fields", () => {
      const artifact = createArtifact("source", "index.ts", "Main Entry");
      const adrNode = createNode(createArtifact("adr", "ADR-001", "ADR"));
      const testNode = createNode(createArtifact("test", "test.ts", "Test"));
      const result = createTraceResult(artifact, [adrNode], [testNode]);

      const output = formatter.format(result);
      const parsed = JSON.parse(output);

      expect(parsed.artifact).toEqual(artifact);
      expect(parsed.upstream).toHaveLength(1);
      expect(parsed.downstream).toHaveLength(1);
      expect(parsed.missing).toEqual([]);
      expect(parsed.summary).toBeDefined();
      expect(parsed.metadata).toBeDefined();
    });

    it("preserves nested structure", () => {
      const artifact = createArtifact("source", "engine.ts");
      const childNode = createNode(createArtifact("request", "CR-001", "CR"));
      const parentNode = createNode(
        createArtifact("adr", "ADR-001", "ADR"),
        [childNode]
      );
      const result = createTraceResult(artifact, [parentNode]);

      const output = formatter.format(result);
      const parsed = JSON.parse(output);

      expect(parsed.upstream[0].children).toHaveLength(1);
      expect(parsed.upstream[0].children[0].artifact.id).toBe("CR-001");
    });

    it("preserves bidirectional status", () => {
      const artifact = createArtifact("source", "engine.ts");
      const node = createNode(createArtifact("adr", "ADR-001", "ADR"));
      node.bidirectional = {
        forward: true,
        reverse: false,
        status: "forward-only",
      };
      const result = createTraceResult(artifact, [node]);

      const output = formatter.format(result);
      const parsed = JSON.parse(output);

      expect(parsed.upstream[0].bidirectional.status).toBe("forward-only");
      expect(parsed.upstream[0].bidirectional.forward).toBe(true);
      expect(parsed.upstream[0].bidirectional.reverse).toBe(false);
    });

    it("preserves missing links", () => {
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
      const parsed = JSON.parse(output);

      expect(parsed.missing).toHaveLength(1);
      expect(parsed.missing[0].expected.id).toBe("ADR-999");
      expect(parsed.missing[0].type).toBe("missing");
    });

    it("preserves summary statistics", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);
      result.summary = {
        totalArtifacts: 10,
        byType: {
          request: 1,
          adr: 2,
          design: 1,
          chain: 0,
          task: 0,
          source: 4,
          test: 2,
          external: 0,
        },
        missingCount: 3,
        incompleteBidirectional: 2,
        maxDepth: 5,
      };

      const output = formatter.format(result);
      const parsed = JSON.parse(output);

      expect(parsed.summary.totalArtifacts).toBe(10);
      expect(parsed.summary.byType.adr).toBe(2);
      expect(parsed.summary.missingCount).toBe(3);
      expect(parsed.summary.maxDepth).toBe(5);
    });

    it("preserves metadata", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);
      result.metadata = {
        timestamp: "2025-12-08T12:34:56.789Z",
        direction: "upstream",
        maxDepth: 3,
        cached: true,
        durationMs: 42,
      };

      const output = formatter.format(result);
      const parsed = JSON.parse(output);

      expect(parsed.metadata.timestamp).toBe("2025-12-08T12:34:56.789Z");
      expect(parsed.metadata.direction).toBe("upstream");
      expect(parsed.metadata.maxDepth).toBe(3);
      expect(parsed.metadata.cached).toBe(true);
      expect(parsed.metadata.durationMs).toBe(42);
    });
  });

  describe("indentation", () => {
    it("uses default indentation of 2 spaces", () => {
      const artifact = createArtifact("source", "index.ts");
      const result = createTraceResult(artifact);

      const output = formatter.format(result);

      // Check for 2-space indentation
      expect(output).toContain("\n  ");
    });

    it("respects custom indentation", () => {
      const artifact = createArtifact("source", "index.ts");
      const result = createTraceResult(artifact);

      const output = formatter.format(result, { indent: 4 });

      // Check for 4-space indentation
      expect(output).toContain("\n    ");
    });

    it("produces compact JSON with indent 0", () => {
      const artifact = createArtifact("source", "index.ts");
      const result = createTraceResult(artifact);

      const output = formatter.format(result, { indent: 0 });

      // Should be single line (no newlines in middle)
      const lines = output.split("\n");
      expect(lines.length).toBe(1);
    });
  });

  describe("edge cases", () => {
    it("handles empty upstream and downstream", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);

      const output = formatter.format(result);
      const parsed = JSON.parse(output);

      expect(parsed.upstream).toEqual([]);
      expect(parsed.downstream).toEqual([]);
    });

    it("handles null maxDepth in metadata", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);
      result.metadata.maxDepth = null;

      const output = formatter.format(result);
      const parsed = JSON.parse(output);

      expect(parsed.metadata.maxDepth).toBeNull();
    });

    it("handles special characters in titles", () => {
      const artifact = createArtifact(
        "source",
        "engine.ts",
        'Title with "quotes" and \\ backslash'
      );
      const result = createTraceResult(artifact);

      const output = formatter.format(result);

      // Should not throw and should be valid JSON
      expect(() => JSON.parse(output)).not.toThrow();
      const parsed = JSON.parse(output);
      expect(parsed.artifact.title).toBe(
        'Title with "quotes" and \\ backslash'
      );
    });

    it("handles unicode characters", () => {
      const artifact = createArtifact(
        "source",
        "engine.ts",
        "Title with émojis 🚀 and ünïcödé"
      );
      const result = createTraceResult(artifact);

      const output = formatter.format(result);
      const parsed = JSON.parse(output);

      expect(parsed.artifact.title).toBe("Title with émojis 🚀 and ünïcödé");
    });

    it("handles deeply nested structures", () => {
      const artifact = createArtifact("source", "engine.ts");

      // Create 10-level deep tree
      let deepNode = createNode(createArtifact("request", "CR-001", "Deep"));
      for (let i = 0; i < 9; i++) {
        deepNode = createNode(
          createArtifact("adr", `ADR-00${i}`, `Level ${i}`),
          [deepNode]
        );
      }

      const result = createTraceResult(artifact, [deepNode]);

      const output = formatter.format(result);
      const parsed = JSON.parse(output);

      // Navigate to the deepest node
      let current = parsed.upstream[0];
      let depth = 1;
      while (current.children && current.children.length > 0) {
        current = current.children[0];
        depth++;
      }

      expect(depth).toBe(10);
      expect(current.artifact.id).toBe("CR-001");
    });
  });

  describe("format options", () => {
    it("ignores color option (not applicable to JSON)", () => {
      const artifact = createArtifact("source", "index.ts");
      const result = createTraceResult(artifact);

      const withColor = formatter.format(result, { color: true });
      const withoutColor = formatter.format(result, { color: false });

      // JSON output should be identical regardless of color option
      expect(withColor).toBe(withoutColor);
    });

    it("ignores includeSummary option (JSON always includes all data)", () => {
      const artifact = createArtifact("source", "index.ts");
      const result = createTraceResult(artifact);

      const output = formatter.format(result, { includeSummary: false });
      const parsed = JSON.parse(output);

      // Summary should still be present
      expect(parsed.summary).toBeDefined();
    });

    it("ignores includeMetadata option (JSON always includes all data)", () => {
      const artifact = createArtifact("source", "index.ts");
      const result = createTraceResult(artifact);

      const output = formatter.format(result, { includeMetadata: false });
      const parsed = JSON.parse(output);

      // Metadata should still be present
      expect(parsed.metadata).toBeDefined();
    });
  });
});
