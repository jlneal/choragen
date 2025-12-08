/**
 * @design-doc docs/design/core/features/trace-command.md
 * @test-type unit
 * @user-intent "Verify trace cache correctly stores, retrieves, expires, and invalidates cached data"
 *
 * Tests for the 4-level TraceCache implementation.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { TraceCache, type DiscoveredLinks } from "../cache.js";
import type {
  ArtifactReference,
  BidirectionalStatus,
  TraceResult,
} from "../types.js";

describe("TraceCache", () => {
  let cache: TraceCache;
  const DEFAULT_TTL_MS = 60000;

  beforeEach(() => {
    cache = new TraceCache(DEFAULT_TTL_MS);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Test fixtures
  const createArtifact = (id: string): ArtifactReference => ({
    type: "adr",
    id,
    path: `docs/adr/done/${id}.md`,
    title: `Test ${id}`,
  });

  const createLinks = (): DiscoveredLinks => ({
    upstream: [createArtifact("ADR-001")],
    downstream: [createArtifact("ADR-002")],
  });

  const createBidirectionalStatus = (): BidirectionalStatus => ({
    forward: true,
    reverse: true,
    status: "complete",
  });

  const createTraceResult = (): TraceResult => ({
    artifact: createArtifact("ADR-001"),
    upstream: [],
    downstream: [],
    missing: [],
    summary: {
      totalArtifacts: 1,
      byType: {
        request: 0,
        adr: 1,
        design: 0,
        chain: 0,
        task: 0,
        source: 0,
        test: 0,
        external: 0,
      },
      missingCount: 0,
      incompleteBidirectional: 0,
      maxDepth: 0,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      direction: "both",
      maxDepth: null,
      cached: false,
      durationMs: 10,
    },
  });

  describe("Level 1: Artifact Metadata Cache", () => {
    it("stores and retrieves artifact metadata", () => {
      const artifact = createArtifact("ADR-001");
      cache.setArtifact("ADR-001", artifact);

      const retrieved = cache.getArtifact("ADR-001");
      expect(retrieved).toEqual(artifact);
    });

    it("returns null for non-existent artifact", () => {
      const retrieved = cache.getArtifact("non-existent");
      expect(retrieved).toBeNull();
    });

    it("reports hasArtifact correctly", () => {
      expect(cache.hasArtifact("ADR-001")).toBe(false);

      cache.setArtifact("ADR-001", createArtifact("ADR-001"));
      expect(cache.hasArtifact("ADR-001")).toBe(true);
    });

    it("expires artifact after TTL", () => {
      cache.setArtifact("ADR-001", createArtifact("ADR-001"));
      expect(cache.getArtifact("ADR-001")).not.toBeNull();

      // Advance time past TTL
      vi.advanceTimersByTime(DEFAULT_TTL_MS + 1);

      expect(cache.getArtifact("ADR-001")).toBeNull();
      expect(cache.hasArtifact("ADR-001")).toBe(false);
    });
  });

  describe("Level 2: Link Discovery Cache", () => {
    it("stores and retrieves discovered links", () => {
      const links = createLinks();
      cache.setLinks("path/to/file.ts", links);

      const retrieved = cache.getLinks("path/to/file.ts");
      expect(retrieved).toEqual(links);
    });

    it("returns null for non-existent links", () => {
      const retrieved = cache.getLinks("non-existent");
      expect(retrieved).toBeNull();
    });

    it("reports hasLinks correctly", () => {
      expect(cache.hasLinks("path/to/file.ts")).toBe(false);

      cache.setLinks("path/to/file.ts", createLinks());
      expect(cache.hasLinks("path/to/file.ts")).toBe(true);
    });

    it("expires links after TTL", () => {
      cache.setLinks("path/to/file.ts", createLinks());
      expect(cache.getLinks("path/to/file.ts")).not.toBeNull();

      vi.advanceTimersByTime(DEFAULT_TTL_MS + 1);

      expect(cache.getLinks("path/to/file.ts")).toBeNull();
    });
  });

  describe("Level 3: Bidirectional Status Cache", () => {
    it("stores and retrieves bidirectional status", () => {
      const status = createBidirectionalStatus();
      cache.setBidirectional("from/path", "to/path", status);

      const retrieved = cache.getBidirectional("from/path", "to/path");
      expect(retrieved).toEqual(status);
    });

    it("returns null for non-existent bidirectional status", () => {
      const retrieved = cache.getBidirectional("from", "to");
      expect(retrieved).toBeNull();
    });

    it("reports hasBidirectional correctly", () => {
      expect(cache.hasBidirectional("from", "to")).toBe(false);

      cache.setBidirectional("from", "to", createBidirectionalStatus());
      expect(cache.hasBidirectional("from", "to")).toBe(true);
    });

    it("expires bidirectional status after TTL", () => {
      cache.setBidirectional("from", "to", createBidirectionalStatus());
      expect(cache.getBidirectional("from", "to")).not.toBeNull();

      vi.advanceTimersByTime(DEFAULT_TTL_MS + 1);

      expect(cache.getBidirectional("from", "to")).toBeNull();
    });

    it("uses correct key format for bidirectional entries", () => {
      const status = createBidirectionalStatus();
      cache.setBidirectional("a/b", "c/d", status);

      // Different order should not match
      expect(cache.getBidirectional("c/d", "a/b")).toBeNull();
      // Same order should match
      expect(cache.getBidirectional("a/b", "c/d")).toEqual(status);
    });
  });

  describe("Level 4: Complete Trace Results Cache", () => {
    it("stores and retrieves trace results", () => {
      const result = createTraceResult();
      cache.setTrace("path/to/artifact", result);

      const retrieved = cache.getTrace("path/to/artifact");
      expect(retrieved).toEqual(result);
    });

    it("returns null for non-existent trace result", () => {
      const retrieved = cache.getTrace("non-existent");
      expect(retrieved).toBeNull();
    });

    it("reports hasTrace correctly", () => {
      expect(cache.hasTrace("path/to/artifact")).toBe(false);

      cache.setTrace("path/to/artifact", createTraceResult());
      expect(cache.hasTrace("path/to/artifact")).toBe(true);
    });

    it("expires trace results after TTL", () => {
      cache.setTrace("path/to/artifact", createTraceResult());
      expect(cache.getTrace("path/to/artifact")).not.toBeNull();

      vi.advanceTimersByTime(DEFAULT_TTL_MS + 1);

      expect(cache.getTrace("path/to/artifact")).toBeNull();
    });
  });

  describe("Cache Management", () => {
    describe("clear", () => {
      it("clears all cache levels", () => {
        cache.setArtifact("ADR-001", createArtifact("ADR-001"));
        cache.setLinks("path", createLinks());
        cache.setBidirectional("from", "to", createBidirectionalStatus());
        cache.setTrace("artifact", createTraceResult());

        cache.clear();

        expect(cache.getArtifact("ADR-001")).toBeNull();
        expect(cache.getLinks("path")).toBeNull();
        expect(cache.getBidirectional("from", "to")).toBeNull();
        expect(cache.getTrace("artifact")).toBeNull();
      });
    });

    describe("prune", () => {
      it("removes expired entries from all caches", () => {
        // Add entries at different times
        cache.setArtifact("ADR-001", createArtifact("ADR-001"));
        cache.setLinks("path1", createLinks());

        vi.advanceTimersByTime(DEFAULT_TTL_MS / 2);

        cache.setArtifact("ADR-002", createArtifact("ADR-002"));
        cache.setLinks("path2", createLinks());

        vi.advanceTimersByTime(DEFAULT_TTL_MS / 2 + 1);

        // First entries should be expired, second should not
        cache.prune();

        // Check stats after prune
        const stats = cache.getStats();
        expect(stats.artifacts).toBe(1); // Only ADR-002 remains
        expect(stats.links).toBe(1); // Only path2 remains
      });
    });

    describe("invalidate", () => {
      it("invalidates artifact cache for path", () => {
        cache.setArtifact("path/to/file", createArtifact("ADR-001"));
        cache.invalidate("path/to/file");
        expect(cache.getArtifact("path/to/file")).toBeNull();
      });

      it("invalidates link cache for path", () => {
        cache.setLinks("path/to/file", createLinks());
        cache.invalidate("path/to/file");
        expect(cache.getLinks("path/to/file")).toBeNull();
      });

      it("invalidates trace cache for path", () => {
        cache.setTrace("path/to/file", createTraceResult());
        cache.invalidate("path/to/file");
        expect(cache.getTrace("path/to/file")).toBeNull();
      });

      it("invalidates bidirectional entries involving the path", () => {
        cache.setBidirectional(
          "path/to/file",
          "other/path",
          createBidirectionalStatus()
        );
        cache.setBidirectional(
          "another/path",
          "path/to/file",
          createBidirectionalStatus()
        );
        cache.setBidirectional(
          "unrelated/a",
          "unrelated/b",
          createBidirectionalStatus()
        );

        cache.invalidate("path/to/file");

        expect(cache.getBidirectional("path/to/file", "other/path")).toBeNull();
        expect(cache.getBidirectional("another/path", "path/to/file")).toBeNull();
        // Unrelated entry should remain
        expect(
          cache.getBidirectional("unrelated/a", "unrelated/b")
        ).not.toBeNull();
      });
    });

    describe("getStats", () => {
      it("returns correct counts for all cache levels", () => {
        cache.setArtifact("ADR-001", createArtifact("ADR-001"));
        cache.setArtifact("ADR-002", createArtifact("ADR-002"));
        cache.setLinks("path1", createLinks());
        cache.setLinks("path2", createLinks());
        cache.setLinks("path3", createLinks());
        cache.setBidirectional("a", "b", createBidirectionalStatus());
        cache.setTrace("trace1", createTraceResult());

        const stats = cache.getStats();

        expect(stats.artifacts).toBe(2);
        expect(stats.links).toBe(3);
        expect(stats.bidirectional).toBe(1);
        expect(stats.traces).toBe(1);
      });

      it("returns zeros for empty cache", () => {
        const stats = cache.getStats();

        expect(stats.artifacts).toBe(0);
        expect(stats.links).toBe(0);
        expect(stats.bidirectional).toBe(0);
        expect(stats.traces).toBe(0);
      });
    });
  });

  describe("TTL Configuration", () => {
    it("respects custom TTL", () => {
      const shortTtlCache = new TraceCache(100); // 100ms TTL
      shortTtlCache.setArtifact("ADR-001", createArtifact("ADR-001"));

      expect(shortTtlCache.getArtifact("ADR-001")).not.toBeNull();

      vi.advanceTimersByTime(50);
      expect(shortTtlCache.getArtifact("ADR-001")).not.toBeNull();

      vi.advanceTimersByTime(51);
      expect(shortTtlCache.getArtifact("ADR-001")).toBeNull();
    });

    it("uses default TTL when not specified", () => {
      const defaultCache = new TraceCache();
      defaultCache.setArtifact("ADR-001", createArtifact("ADR-001"));

      // Should still be valid at 59 seconds
      vi.advanceTimersByTime(59000);
      expect(defaultCache.getArtifact("ADR-001")).not.toBeNull();

      // Should be expired at 61 seconds
      vi.advanceTimersByTime(2000);
      expect(defaultCache.getArtifact("ADR-001")).toBeNull();
    });
  });
});
