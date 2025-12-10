/**
 * @design-doc docs/design/core/features/web-dashboard.md
 * @test-type unit
 * @user-intent "As a user, I want to convert a tag into a group so I can organize tagged requests"
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createCallerFactory } from "@/server/trpc";
import { appRouter } from "@/server/routers";
import * as fs from "fs/promises";
import * as path from "path";

describe("tag-to-group conversion", () => {
  const createCaller = createCallerFactory(appRouter);
  const TEST_PROJECT_ROOT = "/tmp/choragen-tag-to-group-test";

  // Setup test directory structure
  beforeEach(async () => {
    // Create test directories
    await fs.mkdir(
      path.join(TEST_PROJECT_ROOT, "docs/requests/change-requests/todo"),
      { recursive: true }
    );
    await fs.mkdir(
      path.join(TEST_PROJECT_ROOT, ".choragen"),
      { recursive: true }
    );

    // Create empty groups file
    await fs.writeFile(
      path.join(TEST_PROJECT_ROOT, ".choragen/groups.json"),
      JSON.stringify({ groups: [] }, null, 2)
    );

    // Create test request files with tags
    const cr1Content = `# Change Request: Feature A

**ID**: CR-20251209-001  
**Domain**: core  
**Status**: todo  
**Tags**: dashboard, phase-2  
**Created**: 2025-12-09  
**Owner**: agent  

---

## What

Test change request with dashboard tag.
`;

    const cr2Content = `# Change Request: Feature B

**ID**: CR-20251209-002  
**Domain**: web  
**Status**: todo  
**Tags**: dashboard, api  
**Created**: 2025-12-09  
**Owner**: agent  

---

## What

Another request with dashboard tag.
`;

    const cr3Content = `# Change Request: Feature C

**ID**: CR-20251209-003  
**Domain**: cli  
**Status**: todo  
**Tags**: dashboard  
**Created**: 2025-12-09  
**Owner**: agent  

---

## What

Third request with dashboard tag.
`;

    await fs.writeFile(
      path.join(
        TEST_PROJECT_ROOT,
        "docs/requests/change-requests/todo/CR-20251209-001-feature-a.md"
      ),
      cr1Content
    );
    await fs.writeFile(
      path.join(
        TEST_PROJECT_ROOT,
        "docs/requests/change-requests/todo/CR-20251209-002-feature-b.md"
      ),
      cr2Content
    );
    await fs.writeFile(
      path.join(
        TEST_PROJECT_ROOT,
        "docs/requests/change-requests/todo/CR-20251209-003-feature-c.md"
      ),
      cr3Content
    );
  });

  // Cleanup test directory
  afterEach(async () => {
    await fs.rm(TEST_PROJECT_ROOT, { recursive: true, force: true });
  });

  describe("groups.previewFromTag", () => {
    it("returns correct collision info when no collisions exist", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      const preview = await caller.groups.previewFromTag({ tag: "dashboard" });

      expect(preview.tag).toBe("dashboard");
      expect(preview.requestIds).toHaveLength(3);
      expect(preview.requestIds).toContain("CR-20251209-001");
      expect(preview.requestIds).toContain("CR-20251209-002");
      expect(preview.requestIds).toContain("CR-20251209-003");
      expect(preview.collisions).toHaveLength(0);
    });

    it("returns collision info when requests are already in groups", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      // Create a group and add one request to it
      const existingGroup = await caller.groups.create({ name: "Existing Group" });
      await caller.groups.addRequest({
        groupId: existingGroup.id,
        requestId: "CR-20251209-001",
      });

      const preview = await caller.groups.previewFromTag({ tag: "dashboard" });

      expect(preview.tag).toBe("dashboard");
      expect(preview.requestIds).toHaveLength(3);
      expect(preview.collisions).toHaveLength(1);
      expect(preview.collisions[0].requestId).toBe("CR-20251209-001");
      expect(preview.collisions[0].currentGroupId).toBe(existingGroup.id);
      expect(preview.collisions[0].currentGroupName).toBe("Existing Group");
    });

    it("returns empty requestIds for non-existent tag", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      const preview = await caller.groups.previewFromTag({ tag: "nonexistent" });

      expect(preview.tag).toBe("nonexistent");
      expect(preview.requestIds).toHaveLength(0);
      expect(preview.collisions).toHaveLength(0);
    });

    it("normalizes tag to lowercase", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      const preview = await caller.groups.previewFromTag({ tag: "DASHBOARD" });

      expect(preview.tag).toBe("dashboard");
      expect(preview.requestIds).toHaveLength(3);
    });
  });

  describe("groups.createFromTag with 'move-all' strategy", () => {
    it("creates group with all tagged requests when no collisions", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      const result = await caller.groups.createFromTag({
        tag: "dashboard",
        collisionStrategy: "move-all",
      });

      expect(result.group.name).toBe("dashboard");
      expect(result.group.requestIds).toHaveLength(3);
      expect(result.addedCount).toBe(3);
      expect(result.skippedCount).toBe(0);
    });

    it("moves all requests including collisions to new group", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      // Create existing group with one request
      const existingGroup = await caller.groups.create({ name: "Existing Group" });
      await caller.groups.addRequest({
        groupId: existingGroup.id,
        requestId: "CR-20251209-001",
      });

      const result = await caller.groups.createFromTag({
        tag: "dashboard",
        collisionStrategy: "move-all",
      });

      expect(result.group.requestIds).toHaveLength(3);
      expect(result.addedCount).toBe(3);
      expect(result.skippedCount).toBe(0);

      // Verify request was removed from old group
      const updatedExistingGroup = await caller.groups.get({ groupId: existingGroup.id });
      expect(updatedExistingGroup.requestIds).not.toContain("CR-20251209-001");
    });
  });

  describe("groups.createFromTag with 'keep-existing' strategy", () => {
    it("only adds requests not already in groups", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      // Create existing group with one request
      const existingGroup = await caller.groups.create({ name: "Existing Group" });
      await caller.groups.addRequest({
        groupId: existingGroup.id,
        requestId: "CR-20251209-001",
      });

      const result = await caller.groups.createFromTag({
        tag: "dashboard",
        collisionStrategy: "keep-existing",
      });

      expect(result.group.requestIds).toHaveLength(2);
      expect(result.group.requestIds).not.toContain("CR-20251209-001");
      expect(result.addedCount).toBe(2);
      expect(result.skippedCount).toBe(1);

      // Verify request stayed in old group
      const updatedExistingGroup = await caller.groups.get({ groupId: existingGroup.id });
      expect(updatedExistingGroup.requestIds).toContain("CR-20251209-001");
    });

    it("creates empty group if all requests are in other groups", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      // Add all requests to existing groups
      const existingGroup = await caller.groups.create({ name: "Existing Group" });
      await caller.groups.addRequest({
        groupId: existingGroup.id,
        requestId: "CR-20251209-001",
      });
      await caller.groups.addRequest({
        groupId: existingGroup.id,
        requestId: "CR-20251209-002",
      });
      await caller.groups.addRequest({
        groupId: existingGroup.id,
        requestId: "CR-20251209-003",
      });

      const result = await caller.groups.createFromTag({
        tag: "dashboard",
        collisionStrategy: "keep-existing",
      });

      expect(result.group.requestIds).toHaveLength(0);
      expect(result.addedCount).toBe(0);
      expect(result.skippedCount).toBe(3);
    });
  });

  describe("groups.createFromTag with 'manual' strategy", () => {
    it("respects manual selections for collision requests", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      // Create existing groups with some requests
      const existingGroup = await caller.groups.create({ name: "Existing Group" });
      await caller.groups.addRequest({
        groupId: existingGroup.id,
        requestId: "CR-20251209-001",
      });
      await caller.groups.addRequest({
        groupId: existingGroup.id,
        requestId: "CR-20251209-002",
      });

      const result = await caller.groups.createFromTag({
        tag: "dashboard",
        collisionStrategy: "manual",
        manualSelections: [
          { requestId: "CR-20251209-001", moveToNew: true },
          { requestId: "CR-20251209-002", moveToNew: false },
        ],
      });

      // Should have: CR-001 (moved), CR-003 (not in group)
      // Should NOT have: CR-002 (kept in existing)
      expect(result.group.requestIds).toHaveLength(2);
      expect(result.group.requestIds).toContain("CR-20251209-001");
      expect(result.group.requestIds).toContain("CR-20251209-003");
      expect(result.group.requestIds).not.toContain("CR-20251209-002");
      expect(result.addedCount).toBe(2);
      expect(result.skippedCount).toBe(1);

      // Verify CR-002 stayed in old group
      const updatedExistingGroup = await caller.groups.get({ groupId: existingGroup.id });
      expect(updatedExistingGroup.requestIds).toContain("CR-20251209-002");
      expect(updatedExistingGroup.requestIds).not.toContain("CR-20251209-001");
    });

    it("treats missing manual selections as keep-existing", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      // Create existing group with one request
      const existingGroup = await caller.groups.create({ name: "Existing Group" });
      await caller.groups.addRequest({
        groupId: existingGroup.id,
        requestId: "CR-20251209-001",
      });

      // Don't provide manual selection for the collision
      const result = await caller.groups.createFromTag({
        tag: "dashboard",
        collisionStrategy: "manual",
        manualSelections: [],
      });

      // CR-001 should stay in existing group (no selection = keep)
      expect(result.group.requestIds).toHaveLength(2);
      expect(result.group.requestIds).not.toContain("CR-20251209-001");
    });
  });

  describe("tag preservation after conversion", () => {
    it("does NOT remove tag from requests after creating group", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      await caller.groups.createFromTag({
        tag: "dashboard",
        collisionStrategy: "move-all",
      });

      // Verify tags are still present
      const tags = await caller.tags.list();
      expect(tags).toContain("dashboard");

      // Verify individual request still has tag
      const request = await caller.requests.get("CR-20251209-001");
      expect(request.tags).toContain("dashboard");
    });
  });

  describe("group name collision handling", () => {
    it("appends suffix when group name already exists", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      // Create a group with the same name as the tag
      await caller.groups.create({ name: "dashboard" });

      const result = await caller.groups.createFromTag({
        tag: "dashboard",
        collisionStrategy: "move-all",
      });

      expect(result.group.name).toBe("dashboard-2");
    });

    it("increments suffix until unique name found", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      // Create groups that would conflict
      await caller.groups.create({ name: "dashboard" });
      await caller.groups.create({ name: "dashboard-2" });

      const result = await caller.groups.createFromTag({
        tag: "dashboard",
        collisionStrategy: "move-all",
      });

      expect(result.group.name).toBe("dashboard-3");
    });
  });
});
