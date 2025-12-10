/**
 * @design-doc docs/design/core/features/web-dashboard.md
 * @test-type unit
 * @user-intent "As a user, I want to tag requests so I can categorize and filter them"
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createCallerFactory } from "@/server/trpc";
import { appRouter } from "@/server/routers";
import * as fs from "fs/promises";
import * as path from "path";

describe("tags router", () => {
  const createCaller = createCallerFactory(appRouter);
  const TEST_PROJECT_ROOT = "/tmp/choragen-tags-test";

  // Setup test directory structure
  beforeEach(async () => {
    // Create test directories
    await fs.mkdir(
      path.join(TEST_PROJECT_ROOT, "docs/requests/change-requests/todo"),
      { recursive: true }
    );
    await fs.mkdir(
      path.join(TEST_PROJECT_ROOT, "docs/requests/fix-requests/todo"),
      { recursive: true }
    );

    // Create test request files with tags
    const cr1Content = `# Change Request: Test Feature

**ID**: CR-20251209-001  
**Domain**: core  
**Status**: todo  
**Tags**: dashboard, phase-2  
**Created**: 2025-12-09  
**Owner**: agent  

---

## What

Test change request with tags.
`;

    const cr2Content = `# Change Request: Another Feature

**ID**: CR-20251209-002  
**Domain**: web  
**Status**: todo  
**Tags**: dashboard, api  
**Created**: 2025-12-09  
**Owner**: agent  

---

## What

Another test change request.
`;

    const cr3Content = `# Change Request: No Tags

**ID**: CR-20251209-003  
**Domain**: cli  
**Status**: todo  
**Created**: 2025-12-09  
**Owner**: agent  

---

## What

Request without tags.
`;

    await fs.writeFile(
      path.join(
        TEST_PROJECT_ROOT,
        "docs/requests/change-requests/todo/CR-20251209-001-test-feature.md"
      ),
      cr1Content
    );
    await fs.writeFile(
      path.join(
        TEST_PROJECT_ROOT,
        "docs/requests/change-requests/todo/CR-20251209-002-another-feature.md"
      ),
      cr2Content
    );
    await fs.writeFile(
      path.join(
        TEST_PROJECT_ROOT,
        "docs/requests/change-requests/todo/CR-20251209-003-no-tags.md"
      ),
      cr3Content
    );
  });

  // Cleanup test directory
  afterEach(async () => {
    await fs.rm(TEST_PROJECT_ROOT, { recursive: true, force: true });
  });

  describe("tags.list", () => {
    it("returns all unique tags from requests", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });
      const tags = await caller.tags.list();

      expect(tags).toContain("dashboard");
      expect(tags).toContain("phase-2");
      expect(tags).toContain("api");
      expect(tags).toHaveLength(3);
    });

    it("returns tags sorted alphabetically", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });
      const tags = await caller.tags.list();

      expect(tags).toEqual(["api", "dashboard", "phase-2"]);
    });

    it("returns empty array when no tags exist", async () => {
      // Remove files with tags
      await fs.unlink(
        path.join(
          TEST_PROJECT_ROOT,
          "docs/requests/change-requests/todo/CR-20251209-001-test-feature.md"
        )
      );
      await fs.unlink(
        path.join(
          TEST_PROJECT_ROOT,
          "docs/requests/change-requests/todo/CR-20251209-002-another-feature.md"
        )
      );

      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });
      const tags = await caller.tags.list();

      expect(tags).toEqual([]);
    });
  });

  describe("tags.rename", () => {
    it("renames a tag across all requests", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      const result = await caller.tags.rename({
        oldTag: "dashboard",
        newTag: "ui",
      });

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(2);

      // Verify tags were updated
      const tags = await caller.tags.list();
      expect(tags).toContain("ui");
      expect(tags).not.toContain("dashboard");
    });

    it("returns error for non-existent tag", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      await expect(
        caller.tags.rename({
          oldTag: "nonexistent",
          newTag: "new-tag",
        })
      ).rejects.toThrow();
    });

    it("returns success with zero count when renaming to same name", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      const result = await caller.tags.rename({
        oldTag: "dashboard",
        newTag: "dashboard",
      });

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(0);
    });
  });

  describe("requests.addTag", () => {
    it("adds a new tag to a request", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      const result = await caller.requests.addTag({
        requestId: "CR-20251209-003",
        tag: "new-tag",
      });

      expect(result.success).toBe(true);
      expect(result.metadata.tags).toContain("new-tag");

      // Verify tag was persisted
      const tags = await caller.tags.list();
      expect(tags).toContain("new-tag");
    });

    it("normalizes tag to lowercase", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      const result = await caller.requests.addTag({
        requestId: "CR-20251209-003",
        tag: "NEW-TAG",
      });

      expect(result.metadata.tags).toContain("new-tag");
    });

    it("does not duplicate existing tag", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      const result = await caller.requests.addTag({
        requestId: "CR-20251209-001",
        tag: "dashboard",
      });

      expect(result.success).toBe(true);
      // Should still have only 2 tags
      expect(result.metadata.tags).toHaveLength(2);
    });

    it("returns error for non-existent request", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      await expect(
        caller.requests.addTag({
          requestId: "CR-NONEXISTENT",
          tag: "test",
        })
      ).rejects.toThrow();
    });
  });

  describe("requests.removeTag", () => {
    it("removes a tag from a request", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      const result = await caller.requests.removeTag({
        requestId: "CR-20251209-001",
        tag: "phase-2",
      });

      expect(result.success).toBe(true);
      expect(result.metadata.tags).not.toContain("phase-2");
      expect(result.metadata.tags).toContain("dashboard");
    });

    it("handles removing non-existent tag gracefully", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      const result = await caller.requests.removeTag({
        requestId: "CR-20251209-001",
        tag: "nonexistent",
      });

      expect(result.success).toBe(true);
      // Tags should be unchanged
      expect(result.metadata.tags).toHaveLength(2);
    });

    it("removes Tags line when last tag is removed", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      // Remove both tags
      await caller.requests.removeTag({
        requestId: "CR-20251209-001",
        tag: "dashboard",
      });
      const result = await caller.requests.removeTag({
        requestId: "CR-20251209-001",
        tag: "phase-2",
      });

      expect(result.success).toBe(true);
      expect(result.metadata.tags).toHaveLength(0);

      // Verify file content doesn't have Tags line
      const content = await fs.readFile(
        path.join(
          TEST_PROJECT_ROOT,
          "docs/requests/change-requests/todo/CR-20251209-001-test-feature.md"
        ),
        "utf-8"
      );
      expect(content).not.toContain("**Tags**:");
    });
  });
});
