/**
 * @design-doc docs/design/core/features/web-dashboard.md
 * @test-type unit
 * @user-intent "As a user, I want to reorder backlog requests by priority"
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createCallerFactory } from "@/server/trpc";
import { appRouter } from "@/server/routers";
import * as fs from "fs/promises";
import * as path from "path";

describe("backlog sequencing", () => {
  const createCaller = createCallerFactory(appRouter);
  const TEST_PROJECT_ROOT = "/tmp/choragen-backlog-sequencing-test";

  // Setup test directory structure
  beforeEach(async () => {
    // Create .choragen directory
    await fs.mkdir(path.join(TEST_PROJECT_ROOT, ".choragen"), {
      recursive: true,
    });

    // Create test directories for backlog requests
    await fs.mkdir(
      path.join(TEST_PROJECT_ROOT, "docs/requests/change-requests/backlog"),
      { recursive: true }
    );

    // Create test backlog requests
    const requests = [
      { id: "CR-20251209-001", title: "First Request" },
      { id: "CR-20251209-002", title: "Second Request" },
      { id: "CR-20251209-003", title: "Third Request" },
    ];

    for (const req of requests) {
      const content = `# Change Request: ${req.title}

**ID**: ${req.id}  
**Domain**: core  
**Status**: backlog  
**Created**: 2025-12-09  
**Owner**: agent  

---

## What

Test change request.
`;
      await fs.writeFile(
        path.join(
          TEST_PROJECT_ROOT,
          `docs/requests/change-requests/backlog/${req.id}-test.md`
        ),
        content
      );
    }

    // Create initial empty ranks file
    await fs.writeFile(
      path.join(TEST_PROJECT_ROOT, ".choragen/backlog-ranks.json"),
      JSON.stringify({ ranks: [] }, null, 2)
    );
  });

  // Cleanup test directory
  afterEach(async () => {
    await fs.rm(TEST_PROJECT_ROOT, { recursive: true, force: true });
  });

  describe("backlog.getRanks", () => {
    it("returns empty array when no ranks exist", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });
      const ranks = await caller.backlog.getRanks();
      expect(ranks).toEqual([]);
    });

    it("returns normalized ranks sorted by rank number", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      // Add some ranks
      await caller.backlog.addRequest({ requestId: "CR-20251209-001" });
      await caller.backlog.addRequest({ requestId: "CR-20251209-002" });

      const ranks = await caller.backlog.getRanks();
      expect(ranks).toHaveLength(2);
      expect(ranks[0].rank).toBe(1);
      expect(ranks[1].rank).toBe(2);
    });
  });

  describe("backlog.addRequest", () => {
    it("adds a request with the next available rank", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      const ranks = await caller.backlog.addRequest({
        requestId: "CR-20251209-001",
      });

      expect(ranks).toHaveLength(1);
      expect(ranks[0]).toEqual({ requestId: "CR-20251209-001", rank: 1 });
    });

    it("adds subsequent requests with incrementing ranks", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      await caller.backlog.addRequest({ requestId: "CR-20251209-001" });
      await caller.backlog.addRequest({ requestId: "CR-20251209-002" });
      const ranks = await caller.backlog.addRequest({
        requestId: "CR-20251209-003",
      });

      expect(ranks).toHaveLength(3);
      expect(ranks.map((r) => r.rank)).toEqual([1, 2, 3]);
    });

    it("does not duplicate existing requests", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      await caller.backlog.addRequest({ requestId: "CR-20251209-001" });
      const ranks = await caller.backlog.addRequest({
        requestId: "CR-20251209-001",
      });

      expect(ranks).toHaveLength(1);
    });
  });

  describe("backlog.removeRequest", () => {
    it("removes a request and normalizes remaining ranks", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      await caller.backlog.addRequest({ requestId: "CR-20251209-001" });
      await caller.backlog.addRequest({ requestId: "CR-20251209-002" });
      await caller.backlog.addRequest({ requestId: "CR-20251209-003" });

      const ranks = await caller.backlog.removeRequest({
        requestId: "CR-20251209-002",
      });

      expect(ranks).toHaveLength(2);
      expect(ranks.map((r) => r.requestId)).toEqual([
        "CR-20251209-001",
        "CR-20251209-003",
      ]);
      // Ranks should be normalized (no gaps)
      expect(ranks.map((r) => r.rank)).toEqual([1, 2]);
    });

    it("handles removing non-existent request gracefully", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      await caller.backlog.addRequest({ requestId: "CR-20251209-001" });
      const ranks = await caller.backlog.removeRequest({
        requestId: "CR-NONEXISTENT",
      });

      expect(ranks).toHaveLength(1);
    });
  });

  describe("backlog.reorder", () => {
    it("moves a request to a new rank position", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      await caller.backlog.addRequest({ requestId: "CR-20251209-001" });
      await caller.backlog.addRequest({ requestId: "CR-20251209-002" });
      await caller.backlog.addRequest({ requestId: "CR-20251209-003" });

      // Move third request to first position
      const ranks = await caller.backlog.reorder({
        requestId: "CR-20251209-003",
        newRank: 1,
      });

      expect(ranks.map((r) => r.requestId)).toEqual([
        "CR-20251209-003",
        "CR-20251209-001",
        "CR-20251209-002",
      ]);
      expect(ranks.map((r) => r.rank)).toEqual([1, 2, 3]);
    });

    it("moves a request down in the list", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      await caller.backlog.addRequest({ requestId: "CR-20251209-001" });
      await caller.backlog.addRequest({ requestId: "CR-20251209-002" });
      await caller.backlog.addRequest({ requestId: "CR-20251209-003" });

      // Move first request to last position
      const ranks = await caller.backlog.reorder({
        requestId: "CR-20251209-001",
        newRank: 3,
      });

      expect(ranks.map((r) => r.requestId)).toEqual([
        "CR-20251209-002",
        "CR-20251209-003",
        "CR-20251209-001",
      ]);
    });

    it("clamps rank to valid range", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      await caller.backlog.addRequest({ requestId: "CR-20251209-001" });
      await caller.backlog.addRequest({ requestId: "CR-20251209-002" });

      // Try to move to rank 100 (should clamp to 2)
      const ranks = await caller.backlog.reorder({
        requestId: "CR-20251209-001",
        newRank: 100,
      });

      expect(ranks.map((r) => r.requestId)).toEqual([
        "CR-20251209-002",
        "CR-20251209-001",
      ]);
    });

    it("throws error for non-existent request", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      await caller.backlog.addRequest({ requestId: "CR-20251209-001" });

      await expect(
        caller.backlog.reorder({
          requestId: "CR-NONEXISTENT",
          newRank: 1,
        })
      ).rejects.toThrow("Request not found in backlog ranks");
    });

    it("no-op when moving to same position", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      await caller.backlog.addRequest({ requestId: "CR-20251209-001" });
      await caller.backlog.addRequest({ requestId: "CR-20251209-002" });

      const ranks = await caller.backlog.reorder({
        requestId: "CR-20251209-001",
        newRank: 1,
      });

      expect(ranks.map((r) => r.requestId)).toEqual([
        "CR-20251209-001",
        "CR-20251209-002",
      ]);
    });
  });

  describe("backlog.sync", () => {
    it("adds missing requests to ranks", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      const ranks = await caller.backlog.sync({
        backlogRequestIds: ["CR-20251209-001", "CR-20251209-002"],
      });

      expect(ranks).toHaveLength(2);
      expect(ranks.map((r) => r.requestId)).toContain("CR-20251209-001");
      expect(ranks.map((r) => r.requestId)).toContain("CR-20251209-002");
    });

    it("removes stale entries not in backlog", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      // Add some ranks
      await caller.backlog.addRequest({ requestId: "CR-20251209-001" });
      await caller.backlog.addRequest({ requestId: "CR-20251209-002" });
      await caller.backlog.addRequest({ requestId: "CR-STALE" });

      // Sync with only two requests (CR-STALE should be removed)
      const ranks = await caller.backlog.sync({
        backlogRequestIds: ["CR-20251209-001", "CR-20251209-002"],
      });

      expect(ranks).toHaveLength(2);
      expect(ranks.map((r) => r.requestId)).not.toContain("CR-STALE");
    });

    it("preserves existing rank order for known requests", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      // Add ranks in specific order
      await caller.backlog.addRequest({ requestId: "CR-20251209-002" });
      await caller.backlog.addRequest({ requestId: "CR-20251209-001" });

      // Sync should preserve order
      const ranks = await caller.backlog.sync({
        backlogRequestIds: ["CR-20251209-001", "CR-20251209-002"],
      });

      expect(ranks[0].requestId).toBe("CR-20251209-002");
      expect(ranks[1].requestId).toBe("CR-20251209-001");
    });
  });

  describe("backlog.moveGroup", () => {
    beforeEach(async () => {
      // Create groups file with a test group
      const groupsData = {
        groups: [
          {
            id: "grp-test-1",
            name: "Test Group",
            requestIds: ["CR-20251209-002", "CR-20251209-003"],
            rank: 1,
            createdAt: "2025-12-09T00:00:00.000Z",
            updatedAt: "2025-12-09T00:00:00.000Z",
          },
        ],
      };
      await fs.writeFile(
        path.join(TEST_PROJECT_ROOT, ".choragen/groups.json"),
        JSON.stringify(groupsData, null, 2)
      );
    });

    it("moves group members up in priority", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      // Setup: CR-001 at rank 1, CR-002 at rank 2, CR-003 at rank 3
      await caller.backlog.addRequest({ requestId: "CR-20251209-001" });
      await caller.backlog.addRequest({ requestId: "CR-20251209-002" });
      await caller.backlog.addRequest({ requestId: "CR-20251209-003" });

      // Move group (CR-002, CR-003) up by 1
      const ranks = await caller.backlog.moveGroup({
        groupId: "grp-test-1",
        delta: -1,
      });

      // Group members should now be at ranks 1 and 2
      const groupMemberRanks = ranks
        .filter((r) =>
          ["CR-20251209-002", "CR-20251209-003"].includes(r.requestId)
        )
        .map((r) => r.rank);

      expect(groupMemberRanks).toContain(1);
      expect(groupMemberRanks).toContain(2);
    });

    it("throws error for non-existent group", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      await expect(
        caller.backlog.moveGroup({
          groupId: "grp-nonexistent",
          delta: 1,
        })
      ).rejects.toThrow("Group not found");
    });
  });

  describe("rank normalization", () => {
    it("ensures ranks are always contiguous (no gaps)", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      // Add requests
      await caller.backlog.addRequest({ requestId: "CR-20251209-001" });
      await caller.backlog.addRequest({ requestId: "CR-20251209-002" });
      await caller.backlog.addRequest({ requestId: "CR-20251209-003" });

      // Remove middle request
      await caller.backlog.removeRequest({ requestId: "CR-20251209-002" });

      const ranks = await caller.backlog.getRanks();

      // Ranks should be 1, 2 (not 1, 3)
      expect(ranks.map((r) => r.rank)).toEqual([1, 2]);
    });

    it("ensures ranks start from 1", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      await caller.backlog.addRequest({ requestId: "CR-20251209-001" });
      const ranks = await caller.backlog.getRanks();

      expect(ranks[0].rank).toBe(1);
    });
  });
});
