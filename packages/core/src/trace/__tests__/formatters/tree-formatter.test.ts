/**
 * @design-doc docs/design/core/features/trace-command.md
 * @test-type unit
 * @user-intent "Verify tree formatter produces correct hierarchical output with proper symbols and colors"
 *
 * Tests for the TreeFormatter that produces human-readable trace output.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { TreeFormatter } from "../../formatters/tree-formatter.js";
import type { TraceResult, TraceNode, ArtifactReference } from "../../types.js";

describe("TreeFormatter", () => {
  let formatter: TreeFormatter;

  beforeEach(() => {
    formatter = new TreeFormatter();
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
    it("reports tree as output format", () => {
      expect(formatter.outputFormat).toBe("tree");
    });
  });

  describe("format", () => {
    it("formats basic trace result", () => {
      const artifact = createArtifact("source", "index.ts", "Main Entry");
      const result = createTraceResult(artifact);

      const output = formatter.format(result, { color: false });

      expect(output).toContain("Traceability for:");
      expect(output).toContain("Main Entry");
    });

    it("uses artifact ID when title is not available", () => {
      const artifact = createArtifact("source", "index.ts");
      const result = createTraceResult(artifact);

      const output = formatter.format(result, { color: false });

      expect(output).toContain("index.ts");
    });

    it("formats upstream trace section", () => {
      const artifact = createArtifact("source", "engine.ts", "TraceEngine");
      const adrNode = createNode(
        createArtifact("adr", "ADR-001", "Task File Format")
      );
      const result = createTraceResult(artifact, [adrNode]);

      const output = formatter.format(result, { color: false });

      expect(output).toContain("UPSTREAM (toward intent):");
      expect(output).toContain("ADR:");
      expect(output).toContain("Task File Format");
    });

    it("formats downstream trace section", () => {
      const artifact = createArtifact("source", "engine.ts", "TraceEngine");
      const testNode = createNode(
        createArtifact("test", "engine.test.ts", "Engine Tests")
      );
      const result = createTraceResult(artifact, [], [testNode]);

      const output = formatter.format(result, { color: false });

      expect(output).toContain("DOWNSTREAM (toward verification):");
      expect(output).toContain("Test:");
      expect(output).toContain("Engine Tests");
    });

    it("formats nested tree structure", () => {
      const artifact = createArtifact("source", "engine.ts");
      const designNode = createNode(
        createArtifact("design", "trace.md", "Trace Design")
      );
      const requestNode = createNode(
        createArtifact("request", "CR-001", "Change Request"),
        "complete",
        []
      );
      const adrNode = createNode(
        createArtifact("adr", "ADR-001", "ADR"),
        "complete",
        [designNode, requestNode]
      );
      const result = createTraceResult(artifact, [adrNode]);

      const output = formatter.format(result, { color: false });

      // Should show tree structure with proper indentation
      expect(output).toContain("├──");
      expect(output).toContain("└──");
    });

    it("shows bidirectional status indicators", () => {
      const artifact = createArtifact("source", "engine.ts");
      const completeNode = createNode(
        createArtifact("adr", "ADR-001", "Complete"),
        "complete"
      );
      const forwardOnlyNode = createNode(
        createArtifact("adr", "ADR-002", "Forward Only"),
        "forward-only"
      );
      const result = createTraceResult(artifact, [completeNode, forwardOnlyNode]);

      const output = formatter.format(result, { color: false });

      expect(output).toContain("[bidirectional ✓]");
      expect(output).toContain("[forward-only ⚠]");
    });

    it("shows hint for forward-only links", () => {
      const artifact = createArtifact("source", "engine.ts");
      const forwardOnlyNode = createNode(
        createArtifact("adr", "ADR-001", "Forward Only"),
        "forward-only"
      );
      const result = createTraceResult(artifact, [forwardOnlyNode]);

      const output = formatter.format(result, { color: false });

      expect(output).toContain("links to target, but target doesn't link back");
    });

    it("formats all artifact type labels correctly", () => {
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

      const output = formatter.format(result, { color: false });

      expect(output).toContain("Request:");
      expect(output).toContain("ADR:");
      expect(output).toContain("Design:");
      expect(output).toContain("Chain:");
      expect(output).toContain("Task:");
      expect(output).toContain("Source:");
      expect(output).toContain("Test:");
      expect(output).toContain("External:");
    });
  });

  describe("summary section", () => {
    it("includes summary when option is true", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);

      const output = formatter.format(result, {
        color: false,
        includeSummary: true,
      });

      expect(output).toContain("Summary:");
      expect(output).toContain("Total artifacts:");
    });

    it("excludes summary when option is false", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);

      const output = formatter.format(result, {
        color: false,
        includeSummary: false,
      });

      expect(output).not.toContain("Summary:");
    });

    it("shows missing links count", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);
      result.summary.missingCount = 3;

      const output = formatter.format(result, {
        color: false,
        includeSummary: true,
      });

      expect(output).toContain("Missing links: 3");
    });

    it("shows incomplete bidirectional count", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);
      result.summary.incompleteBidirectional = 2;

      const output = formatter.format(result, {
        color: false,
        includeSummary: true,
      });

      expect(output).toContain("Incomplete bidirectional: 2");
    });
  });

  describe("color handling", () => {
    beforeEach(() => {
      // Mock process.stdout.isTTY
      vi.stubGlobal("process", {
        ...process,
        stdout: { ...process.stdout, isTTY: true },
        env: {},
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("includes ANSI codes when color is enabled and TTY", () => {
      const artifact = createArtifact("source", "engine.ts", "TraceEngine");
      const result = createTraceResult(artifact);

      const output = formatter.format(result, { color: true });

      // Should contain ANSI escape codes
      expect(output).toContain("\x1b[");
    });

    it("excludes ANSI codes when color is disabled", () => {
      const artifact = createArtifact("source", "engine.ts", "TraceEngine");
      const result = createTraceResult(artifact);

      const output = formatter.format(result, { color: false });

      // Should not contain ANSI escape codes
      expect(output).not.toContain("\x1b[");
    });

    it("respects NO_COLOR environment variable", () => {
      vi.stubGlobal("process", {
        ...process,
        stdout: { ...process.stdout, isTTY: true },
        env: { NO_COLOR: "1" },
      });

      const artifact = createArtifact("source", "engine.ts", "TraceEngine");
      const result = createTraceResult(artifact);

      const output = formatter.format(result, { color: true });

      // Should not contain ANSI escape codes due to NO_COLOR
      expect(output).not.toContain("\x1b[");
    });
  });

  describe("edge cases", () => {
    it("handles empty upstream and downstream", () => {
      const artifact = createArtifact("source", "engine.ts");
      const result = createTraceResult(artifact);

      const output = formatter.format(result, { color: false });

      expect(output).toContain("Traceability for:");
      expect(output).not.toContain("UPSTREAM");
      expect(output).not.toContain("DOWNSTREAM");
    });

    it("handles deeply nested trees", () => {
      const artifact = createArtifact("source", "engine.ts");

      // Create a 5-level deep tree
      let deepNode = createNode(createArtifact("request", "CR-001", "Level 5"));
      for (let i = 4; i >= 1; i--) {
        deepNode = createNode(
          createArtifact("adr", `ADR-00${i}`, `Level ${i}`),
          "complete",
          [deepNode]
        );
      }

      const result = createTraceResult(artifact, [deepNode]);

      const output = formatter.format(result, { color: false });

      expect(output).toContain("Level 1");
      expect(output).toContain("Level 5");
    });

    it("handles multiple siblings at same level", () => {
      const artifact = createArtifact("source", "engine.ts");
      const siblings = [
        createNode(createArtifact("adr", "ADR-001", "First")),
        createNode(createArtifact("adr", "ADR-002", "Second")),
        createNode(createArtifact("adr", "ADR-003", "Third")),
      ];
      const result = createTraceResult(artifact, siblings);

      const output = formatter.format(result, { color: false });

      // First two should use ├──, last should use └──
      const branchCount = (output.match(/├──/g) || []).length;
      const lastBranchCount = (output.match(/└──/g) || []).length;

      expect(branchCount).toBe(2);
      expect(lastBranchCount).toBe(1);
    });
  });
});
