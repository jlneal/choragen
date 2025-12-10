/**
 * @design-doc docs/design/core/features/web-dashboard.md
 * @test-type unit
 * @user-intent "As a user, I want to promote/demote requests between backlog and todo"
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createCallerFactory } from "@/server/trpc";
import { appRouter } from "@/server/routers";
import * as fs from "fs/promises";
import * as path from "path";

describe("backlog operations", () => {
  const createCaller = createCallerFactory(appRouter);
  const TEST_PROJECT_ROOT = "/tmp/choragen-backlog-test";

  // Setup test directory structure
  beforeEach(async () => {
    // Create test directories for both backlog and todo
    await fs.mkdir(
      path.join(TEST_PROJECT_ROOT, "docs/requests/change-requests/backlog"),
      { recursive: true }
    );
    await fs.mkdir(
      path.join(TEST_PROJECT_ROOT, "docs/requests/change-requests/todo"),
      { recursive: true }
    );
    await fs.mkdir(
      path.join(TEST_PROJECT_ROOT, "docs/requests/fix-requests/backlog"),
      { recursive: true }
    );
    await fs.mkdir(
      path.join(TEST_PROJECT_ROOT, "docs/requests/fix-requests/todo"),
      { recursive: true }
    );

    // Create test request in backlog
    const backlogContent = `# Change Request: Backlog Feature

**ID**: CR-20251209-001  
**Domain**: core  
**Status**: backlog  
**Created**: 2025-12-09  
**Owner**: agent  

---

## What

Test change request in backlog.
`;

    // Create test request in todo
    const todoContent = `# Change Request: Todo Feature

**ID**: CR-20251209-002  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-09  
**Owner**: agent  

---

## What

Test change request in todo.
`;

    // Create test request in doing (for error case)
    await fs.mkdir(
      path.join(TEST_PROJECT_ROOT, "docs/requests/change-requests/doing"),
      { recursive: true }
    );
    const doingContent = `# Change Request: Doing Feature

**ID**: CR-20251209-003  
**Domain**: core  
**Status**: doing  
**Created**: 2025-12-09  
**Owner**: agent  

---

## What

Test change request in doing.
`;

    await fs.writeFile(
      path.join(
        TEST_PROJECT_ROOT,
        "docs/requests/change-requests/backlog/CR-20251209-001-backlog-feature.md"
      ),
      backlogContent
    );
    await fs.writeFile(
      path.join(
        TEST_PROJECT_ROOT,
        "docs/requests/change-requests/todo/CR-20251209-002-todo-feature.md"
      ),
      todoContent
    );
    await fs.writeFile(
      path.join(
        TEST_PROJECT_ROOT,
        "docs/requests/change-requests/doing/CR-20251209-003-doing-feature.md"
      ),
      doingContent
    );
  });

  // Cleanup test directory
  afterEach(async () => {
    await fs.rm(TEST_PROJECT_ROOT, { recursive: true, force: true });
  });

  describe("requests.promote", () => {
    it("moves request from backlog to todo", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      const result = await caller.requests.promote({
        requestId: "CR-20251209-001",
      });

      expect(result.success).toBe(true);
      expect(result.metadata.status).toBe("todo");

      // Verify file was moved
      const newPath = path.join(
        TEST_PROJECT_ROOT,
        "docs/requests/change-requests/todo/CR-20251209-001-backlog-feature.md"
      );
      const oldPath = path.join(
        TEST_PROJECT_ROOT,
        "docs/requests/change-requests/backlog/CR-20251209-001-backlog-feature.md"
      );

      await expect(fs.access(newPath)).resolves.toBeUndefined();
      await expect(fs.access(oldPath)).rejects.toThrow();

      // Verify status was updated in file content
      const content = await fs.readFile(newPath, "utf-8");
      expect(content).toContain("**Status**: todo");
      expect(content).not.toContain("**Status**: backlog");
    });

    it("returns error for non-existent request", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      await expect(
        caller.requests.promote({
          requestId: "CR-NONEXISTENT",
        })
      ).rejects.toThrow("Request not found");
    });

    it("returns error when request is not in backlog", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      await expect(
        caller.requests.promote({
          requestId: "CR-20251209-002", // This is in todo
        })
      ).rejects.toThrow("is not in backlog");
    });

    it("returns error when promoting request in doing status", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      await expect(
        caller.requests.promote({
          requestId: "CR-20251209-003", // This is in doing
        })
      ).rejects.toThrow("is not in backlog");
    });
  });

  describe("requests.demote", () => {
    it("moves request from todo to backlog", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      const result = await caller.requests.demote({
        requestId: "CR-20251209-002",
      });

      expect(result.success).toBe(true);
      expect(result.metadata.status).toBe("backlog");

      // Verify file was moved
      const newPath = path.join(
        TEST_PROJECT_ROOT,
        "docs/requests/change-requests/backlog/CR-20251209-002-todo-feature.md"
      );
      const oldPath = path.join(
        TEST_PROJECT_ROOT,
        "docs/requests/change-requests/todo/CR-20251209-002-todo-feature.md"
      );

      await expect(fs.access(newPath)).resolves.toBeUndefined();
      await expect(fs.access(oldPath)).rejects.toThrow();

      // Verify status was updated in file content
      const content = await fs.readFile(newPath, "utf-8");
      expect(content).toContain("**Status**: backlog");
      expect(content).not.toContain("**Status**: todo");
    });

    it("returns error for non-existent request", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      await expect(
        caller.requests.demote({
          requestId: "CR-NONEXISTENT",
        })
      ).rejects.toThrow("Request not found");
    });

    it("returns error when request is not in todo", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      await expect(
        caller.requests.demote({
          requestId: "CR-20251209-001", // This is in backlog
        })
      ).rejects.toThrow("is not in todo");
    });

    it("returns error when demoting request in doing status", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      await expect(
        caller.requests.demote({
          requestId: "CR-20251209-003", // This is in doing
        })
      ).rejects.toThrow("is not in todo");
    });
  });

  describe("round-trip operations", () => {
    it("can promote and then demote a request", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      // Promote from backlog to todo
      const promoteResult = await caller.requests.promote({
        requestId: "CR-20251209-001",
      });
      expect(promoteResult.metadata.status).toBe("todo");

      // Demote back to backlog
      const demoteResult = await caller.requests.demote({
        requestId: "CR-20251209-001",
      });
      expect(demoteResult.metadata.status).toBe("backlog");

      // Verify file is back in backlog
      const backlogPath = path.join(
        TEST_PROJECT_ROOT,
        "docs/requests/change-requests/backlog/CR-20251209-001-backlog-feature.md"
      );
      await expect(fs.access(backlogPath)).resolves.toBeUndefined();
    });

    it("can demote and then promote a request", async () => {
      const caller = createCaller({ projectRoot: TEST_PROJECT_ROOT });

      // Demote from todo to backlog
      const demoteResult = await caller.requests.demote({
        requestId: "CR-20251209-002",
      });
      expect(demoteResult.metadata.status).toBe("backlog");

      // Promote back to todo
      const promoteResult = await caller.requests.promote({
        requestId: "CR-20251209-002",
      });
      expect(promoteResult.metadata.status).toBe("todo");

      // Verify file is back in todo
      const todoPath = path.join(
        TEST_PROJECT_ROOT,
        "docs/requests/change-requests/todo/CR-20251209-002-todo-feature.md"
      );
      await expect(fs.access(todoPath)).resolves.toBeUndefined();
    });
  });
});
