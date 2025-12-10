/**
 * @design-doc docs/design/core/features/web-dashboard.md
 * @test-type unit
 * @user-intent "As a user, I want to group related requests so I can manage them collectively"
 */

import { describe, it, expect } from "vitest";
import { createCallerFactory } from "@/server/trpc";
import { appRouter } from "@/server/routers";
import * as fs from "fs/promises";
import * as path from "path";

const createCaller = createCallerFactory(appRouter);

/**
 * Helper to create an isolated test context with its own directory
 */
async function createTestContext() {
  const testProjectRoot = `/tmp/choragen-groups-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Create .choragen directory
  await fs.mkdir(path.join(testProjectRoot, ".choragen"), {
    recursive: true,
  });

  // Create empty groups file
  await fs.writeFile(
    path.join(testProjectRoot, ".choragen/groups.json"),
    JSON.stringify({ groups: [] }, null, 2)
  );

  const caller = createCaller({ projectRoot: testProjectRoot });

  const cleanup = async () => {
    await fs.rm(testProjectRoot, { recursive: true, force: true });
  };

  return { caller, cleanup };
}

describe("groups router", () => {
  describe("groups.list", () => {
    it("returns empty array when no groups exist", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        const groups = await caller.groups.list();
        expect(groups).toEqual([]);
      } finally {
        await cleanup();
      }
    });

    it("returns groups sorted by rank", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        await caller.groups.create({ name: "Group A" });
        await caller.groups.create({ name: "Group B" });
        await caller.groups.create({ name: "Group C" });

        const groups = await caller.groups.list();

        expect(groups).toHaveLength(3);
        expect(groups[0].name).toBe("Group A");
        expect(groups[1].name).toBe("Group B");
        expect(groups[2].name).toBe("Group C");
        expect(groups[0].rank).toBeLessThan(groups[1].rank);
        expect(groups[1].rank).toBeLessThan(groups[2].rank);
      } finally {
        await cleanup();
      }
    });
  });

  describe("groups.create", () => {
    it("creates a new group with correct structure", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        const group = await caller.groups.create({ name: "My Group" });

        expect(group.id).toMatch(/^grp-\d+-[a-z0-9]+$/);
        expect(group.name).toBe("My Group");
        expect(group.requestIds).toEqual([]);
        expect(group.rank).toBe(1);
        expect(group.createdAt).toBeDefined();
        expect(group.updatedAt).toBeDefined();
      } finally {
        await cleanup();
      }
    });

    it("trims whitespace from group name", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        const group = await caller.groups.create({ name: "  Trimmed Name  " });
        expect(group.name).toBe("Trimmed Name");
      } finally {
        await cleanup();
      }
    });

    it("assigns incrementing ranks to new groups", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        const group1 = await caller.groups.create({ name: "First" });
        const group2 = await caller.groups.create({ name: "Second" });
        const group3 = await caller.groups.create({ name: "Third" });

        expect(group1.rank).toBe(1);
        expect(group2.rank).toBe(2);
        expect(group3.rank).toBe(3);
      } finally {
        await cleanup();
      }
    });

    it("rejects empty group name", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        await expect(caller.groups.create({ name: "" })).rejects.toThrow();
      } finally {
        await cleanup();
      }
    });
  });

  describe("groups.get", () => {
    it("returns a group by ID", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        const created = await caller.groups.create({ name: "Test Group" });
        const fetched = await caller.groups.get({ groupId: created.id });

        expect(fetched.id).toBe(created.id);
        expect(fetched.name).toBe("Test Group");
      } finally {
        await cleanup();
      }
    });

    it("throws error for non-existent group", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        await expect(
          caller.groups.get({ groupId: "grp-nonexistent" })
        ).rejects.toThrow("Group not found");
      } finally {
        await cleanup();
      }
    });
  });

  describe("groups.delete", () => {
    it("deletes a group", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        const group = await caller.groups.create({ name: "To Delete" });
        const result = await caller.groups.delete({ groupId: group.id });

        expect(result.success).toBe(true);

        const groups = await caller.groups.list();
        expect(groups).toHaveLength(0);
      } finally {
        await cleanup();
      }
    });

    it("throws error for non-existent group", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        await expect(
          caller.groups.delete({ groupId: "grp-nonexistent" })
        ).rejects.toThrow("Group not found");
      } finally {
        await cleanup();
      }
    });
  });

  describe("groups.rename", () => {
    it("renames a group", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        const group = await caller.groups.create({ name: "Old Name" });
        const renamed = await caller.groups.rename({
          groupId: group.id,
          name: "New Name",
        });

        expect(renamed.name).toBe("New Name");
        expect(renamed.id).toBe(group.id);
      } finally {
        await cleanup();
      }
    });

    it("updates the updatedAt timestamp", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        const group = await caller.groups.create({ name: "Test" });

        // Small delay to ensure different timestamp
        await new Promise((resolve) => setTimeout(resolve, 10));

        const renamed = await caller.groups.rename({
          groupId: group.id,
          name: "Updated",
        });

        expect(new Date(renamed.updatedAt).getTime()).toBeGreaterThanOrEqual(
          new Date(group.updatedAt).getTime()
        );
      } finally {
        await cleanup();
      }
    });

    it("throws error for non-existent group", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        await expect(
          caller.groups.rename({ groupId: "grp-nonexistent", name: "New" })
        ).rejects.toThrow("Group not found");
      } finally {
        await cleanup();
      }
    });
  });

  describe("groups.addRequest", () => {
    it("adds a request to a group", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        const group = await caller.groups.create({ name: "Test Group" });
        const updated = await caller.groups.addRequest({
          groupId: group.id,
          requestId: "CR-20251209-001",
        });

        expect(updated.requestIds).toContain("CR-20251209-001");
      } finally {
        await cleanup();
      }
    });

    it("moves request from one group to another", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        const group1 = await caller.groups.create({ name: "Group 1" });
        const group2 = await caller.groups.create({ name: "Group 2" });

        // Add to first group
        await caller.groups.addRequest({
          groupId: group1.id,
          requestId: "CR-20251209-001",
        });

        // Move to second group
        await caller.groups.addRequest({
          groupId: group2.id,
          requestId: "CR-20251209-001",
        });

        // Verify request is only in second group
        const groups = await caller.groups.list();
        const updatedGroup1 = groups.find((g) => g.id === group1.id);
        const updatedGroup2 = groups.find((g) => g.id === group2.id);

        expect(updatedGroup1?.requestIds).not.toContain("CR-20251209-001");
        expect(updatedGroup2?.requestIds).toContain("CR-20251209-001");
      } finally {
        await cleanup();
      }
    });

    it("does not duplicate request in same group", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        const group = await caller.groups.create({ name: "Test Group" });

        await caller.groups.addRequest({
          groupId: group.id,
          requestId: "CR-20251209-001",
        });

        const updated = await caller.groups.addRequest({
          groupId: group.id,
          requestId: "CR-20251209-001",
        });

        expect(updated.requestIds).toHaveLength(1);
      } finally {
        await cleanup();
      }
    });

    it("throws error for non-existent group", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        await expect(
          caller.groups.addRequest({
            groupId: "grp-nonexistent",
            requestId: "CR-20251209-001",
          })
        ).rejects.toThrow("Group not found");
      } finally {
        await cleanup();
      }
    });
  });

  describe("groups.removeRequest", () => {
    it("removes a request from a group", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        const group = await caller.groups.create({ name: "Test Group" });
        await caller.groups.addRequest({
          groupId: group.id,
          requestId: "CR-20251209-001",
        });

        const updated = await caller.groups.removeRequest({
          groupId: group.id,
          requestId: "CR-20251209-001",
        });

        expect(updated.requestIds).not.toContain("CR-20251209-001");
      } finally {
        await cleanup();
      }
    });

    it("throws error when request is not in group", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        const group = await caller.groups.create({ name: "Test Group" });

        await expect(
          caller.groups.removeRequest({
            groupId: group.id,
            requestId: "CR-20251209-001",
          })
        ).rejects.toThrow("is not in group");
      } finally {
        await cleanup();
      }
    });

    it("throws error for non-existent group", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        await expect(
          caller.groups.removeRequest({
            groupId: "grp-nonexistent",
            requestId: "CR-20251209-001",
          })
        ).rejects.toThrow("Group not found");
      } finally {
        await cleanup();
      }
    });
  });

  describe("groups.move", () => {
    it("moves a group up (decreases rank)", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        await caller.groups.create({ name: "First" });
        const second = await caller.groups.create({ name: "Second" });

        await caller.groups.move({ groupId: second.id, delta: -1 });

        const groups = await caller.groups.list();
        expect(groups[0].name).toBe("Second");
        expect(groups[1].name).toBe("First");
      } finally {
        await cleanup();
      }
    });

    it("moves a group down (increases rank)", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        const first = await caller.groups.create({ name: "First" });
        await caller.groups.create({ name: "Second" });

        await caller.groups.move({ groupId: first.id, delta: 1 });

        const groups = await caller.groups.list();
        expect(groups[0].name).toBe("Second");
        expect(groups[1].name).toBe("First");
      } finally {
        await cleanup();
      }
    });

    it("does nothing when moving first group up", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        const first = await caller.groups.create({ name: "First" });
        await caller.groups.create({ name: "Second" });

        const result = await caller.groups.move({ groupId: first.id, delta: -1 });

        expect(result[0].name).toBe("First");
        expect(result[1].name).toBe("Second");
      } finally {
        await cleanup();
      }
    });

    it("does nothing when moving last group down", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        await caller.groups.create({ name: "First" });
        const second = await caller.groups.create({ name: "Second" });

        const result = await caller.groups.move({ groupId: second.id, delta: 1 });

        expect(result[0].name).toBe("First");
        expect(result[1].name).toBe("Second");
      } finally {
        await cleanup();
      }
    });

    it("throws error for non-existent group", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        await expect(
          caller.groups.move({ groupId: "grp-nonexistent", delta: 1 })
        ).rejects.toThrow("Group not found");
      } finally {
        await cleanup();
      }
    });

    it("rejects invalid delta values", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        const group = await caller.groups.create({ name: "Test" });

        await expect(
          caller.groups.move({ groupId: group.id, delta: 2 })
        ).rejects.toThrow();

        await expect(
          caller.groups.move({ groupId: group.id, delta: 0 })
        ).rejects.toThrow();
      } finally {
        await cleanup();
      }
    });
  });

  describe("groups.getGroupForRequest", () => {
    it("returns the group containing a request", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        const group = await caller.groups.create({ name: "Test Group" });
        await caller.groups.addRequest({
          groupId: group.id,
          requestId: "CR-20251209-001",
        });

        const result = await caller.groups.getGroupForRequest({
          requestId: "CR-20251209-001",
        });

        expect(result).not.toBeNull();
        expect(result?.id).toBe(group.id);
        expect(result?.name).toBe("Test Group");
      } finally {
        await cleanup();
      }
    });

    it("returns null when request is not in any group", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        await caller.groups.create({ name: "Empty Group" });

        const result = await caller.groups.getGroupForRequest({
          requestId: "CR-20251209-001",
        });

        expect(result).toBeNull();
      } finally {
        await cleanup();
      }
    });
  });
});
