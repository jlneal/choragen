/**
 * @design-doc docs/design/core/features/task-chain-management.md
 * @user-intent "Verify TaskManager correctly creates, retrieves, updates, deletes, and transitions tasks with proper status flow"
 * @test-type unit
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { TaskManager } from "../task-manager.js";
// TaskStatus type is used indirectly via STATUS_TRANSITIONS
import { STATUS_TRANSITIONS } from "../types.js";

describe("TaskManager", () => {
  let tempDir: string;
  let taskManager: TaskManager;

  beforeEach(async () => {
    // Create a temp directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-task-test-"));
    taskManager = new TaskManager(tempDir);
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("createTask", () => {
    it("creates a task with basic options", async () => {
      const task = await taskManager.createTask({
        chainId: "CHAIN-001-test",
        slug: "setup-api",
        title: "Setup API",
        description: "Initialize the API structure",
      });

      expect(task.id).toBe("001-setup-api");
      expect(task.sequence).toBe(1);
      expect(task.slug).toBe("setup-api");
      expect(task.status).toBe("backlog");
      expect(task.chainId).toBe("CHAIN-001-test");
      expect(task.title).toBe("Setup API");
      expect(task.description).toBe("Initialize the API structure");
      expect(task.createdAt).toBeInstanceOf(Date);
      expect(task.updatedAt).toBeInstanceOf(Date);
    });

    it("creates a task with all optional fields", async () => {
      const task = await taskManager.createTask({
        chainId: "CHAIN-001-test",
        slug: "full-task",
        title: "Full Task",
        description: "A task with all fields",
        expectedFiles: ["src/api.ts", "src/types.ts"],
        acceptance: ["API responds with 200", "Types are exported"],
        constraints: ["Do not modify existing routes"],
        notes: "Additional context here",
      });

      expect(task.expectedFiles).toEqual(["src/api.ts", "src/types.ts"]);
      expect(task.acceptance).toEqual([
        "API responds with 200",
        "Types are exported",
      ]);
      expect(task.constraints).toEqual(["Do not modify existing routes"]);
      expect(task.notes).toBe("Additional context here");
    });

    it("increments sequence number for subsequent tasks", async () => {
      const chainId = "CHAIN-001-multi";

      const task1 = await taskManager.createTask({
        chainId,
        slug: "first",
        title: "First Task",
        description: "First",
      });

      const task2 = await taskManager.createTask({
        chainId,
        slug: "second",
        title: "Second Task",
        description: "Second",
      });

      const task3 = await taskManager.createTask({
        chainId,
        slug: "third",
        title: "Third Task",
        description: "Third",
      });

      expect(task1.sequence).toBe(1);
      expect(task2.sequence).toBe(2);
      expect(task3.sequence).toBe(3);
      expect(task1.id).toBe("001-first");
      expect(task2.id).toBe("002-second");
      expect(task3.id).toBe("003-third");
    });

    it("creates task file in backlog directory", async () => {
      const task = await taskManager.createTask({
        chainId: "CHAIN-001-file-test",
        slug: "file-check",
        title: "File Check",
        description: "Verify file creation",
      });

      const taskPath = path.join(
        tempDir,
        "docs/tasks/backlog",
        task.chainId,
        `${task.id}.md`
      );
      const stat = await fs.stat(taskPath);
      expect(stat.isFile()).toBe(true);
    });

    it("creates chain directory if it does not exist", async () => {
      const chainId = "CHAIN-001-new-chain";
      await taskManager.createTask({
        chainId,
        slug: "first-task",
        title: "First Task",
        description: "First task in new chain",
      });

      const chainDir = path.join(tempDir, "docs/tasks/backlog", chainId);
      const stat = await fs.stat(chainDir);
      expect(stat.isDirectory()).toBe(true);
    });

    it("defaults optional fields to empty values", async () => {
      const task = await taskManager.createTask({
        chainId: "CHAIN-001-defaults",
        slug: "minimal",
        title: "Minimal Task",
        description: "Only required fields",
      });

      expect(task.expectedFiles).toEqual([]);
      expect(task.acceptance).toEqual([]);
      expect(task.constraints).toEqual([]);
      expect(task.notes).toBe("");
    });
  });

  describe("getTask", () => {
    it("returns null for non-existent task", async () => {
      const task = await taskManager.getTask("CHAIN-001-fake", "001-nonexistent");
      expect(task).toBeNull();
    });

    it("retrieves an existing task from backlog", async () => {
      const created = await taskManager.createTask({
        chainId: "CHAIN-001-retrieve",
        slug: "retrieve-test",
        title: "Retrieve Test",
        description: "Test retrieval",
      });

      const retrieved = await taskManager.getTask(created.chainId, created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.title).toBe("Retrieve Test");
    });

    it("finds task regardless of status directory", async () => {
      const chainId = "CHAIN-001-status-search";
      const created = await taskManager.createTask({
        chainId,
        slug: "status-test",
        title: "Status Test",
        description: "Test",
      });

      // Move to todo first, then to in-progress
      await taskManager.transitionTask(chainId, created.id, "todo");
      await taskManager.transitionTask(chainId, created.id, "in-progress");

      const retrieved = await taskManager.getTask(chainId, created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.status).toBe("in-progress");
    });
  });

  describe("getTasksForChain", () => {
    it("returns empty array for chain with no tasks", async () => {
      const tasks = await taskManager.getTasksForChain("CHAIN-001-empty");
      expect(tasks).toEqual([]);
    });

    it("returns all tasks for a chain", async () => {
      const chainId = "CHAIN-001-list";

      await taskManager.createTask({
        chainId,
        slug: "task-one",
        title: "Task One",
        description: "First",
      });
      await taskManager.createTask({
        chainId,
        slug: "task-two",
        title: "Task Two",
        description: "Second",
      });
      await taskManager.createTask({
        chainId,
        slug: "task-three",
        title: "Task Three",
        description: "Third",
      });

      const tasks = await taskManager.getTasksForChain(chainId);
      expect(tasks).toHaveLength(3);
    });

    it("returns tasks sorted by sequence", async () => {
      const chainId = "CHAIN-001-sorted";

      await taskManager.createTask({
        chainId,
        slug: "first",
        title: "First",
        description: "1",
      });
      await taskManager.createTask({
        chainId,
        slug: "second",
        title: "Second",
        description: "2",
      });
      await taskManager.createTask({
        chainId,
        slug: "third",
        title: "Third",
        description: "3",
      });

      const tasks = await taskManager.getTasksForChain(chainId);
      expect(tasks[0].sequence).toBe(1);
      expect(tasks[1].sequence).toBe(2);
      expect(tasks[2].sequence).toBe(3);
    });

    it("includes tasks from all status directories", async () => {
      const chainId = "CHAIN-001-multi-status";

      // task1 stays in backlog (intentionally unused - verifies backlog status is included)
      await taskManager.createTask({
        chainId,
        slug: "backlog-task",
        title: "Backlog Task",
        description: "In backlog",
      });

      const task2 = await taskManager.createTask({
        chainId,
        slug: "todo-task",
        title: "Todo Task",
        description: "In todo",
      });

      const task3 = await taskManager.createTask({
        chainId,
        slug: "progress-task",
        title: "Progress Task",
        description: "In progress",
      });

      // Move tasks to different statuses
      await taskManager.transitionTask(chainId, task2.id, "todo");
      await taskManager.transitionTask(chainId, task3.id, "todo");
      await taskManager.transitionTask(chainId, task3.id, "in-progress");

      const tasks = await taskManager.getTasksForChain(chainId);
      expect(tasks).toHaveLength(3);

      const statuses = tasks.map((t) => t.status);
      expect(statuses).toContain("backlog");
      expect(statuses).toContain("todo");
      expect(statuses).toContain("in-progress");
    });
  });

  describe("transitionTask - status flow", () => {
    it("transitions from backlog to todo", async () => {
      const chainId = "CHAIN-001-transition";
      const task = await taskManager.createTask({
        chainId,
        slug: "backlog-to-todo",
        title: "Backlog to Todo",
        description: "Test transition",
      });

      const result = await taskManager.transitionTask(chainId, task.id, "todo");

      expect(result.success).toBe(true);
      expect(result.previousStatus).toBe("backlog");
      expect(result.newStatus).toBe("todo");
      expect(result.task.status).toBe("todo");
    });

    it("transitions from todo to in-progress", async () => {
      const chainId = "CHAIN-001-todo-progress";
      const task = await taskManager.createTask({
        chainId,
        slug: "todo-to-progress",
        title: "Todo to Progress",
        description: "Test",
      });

      await taskManager.transitionTask(chainId, task.id, "todo");
      const result = await taskManager.transitionTask(
        chainId,
        task.id,
        "in-progress"
      );

      expect(result.success).toBe(true);
      expect(result.previousStatus).toBe("todo");
      expect(result.newStatus).toBe("in-progress");
    });

    it("transitions from in-progress to in-review", async () => {
      const chainId = "CHAIN-001-progress-review";
      const task = await taskManager.createTask({
        chainId,
        slug: "progress-to-review",
        title: "Progress to Review",
        description: "Test",
      });

      await taskManager.transitionTask(chainId, task.id, "todo");
      await taskManager.transitionTask(chainId, task.id, "in-progress");
      const result = await taskManager.transitionTask(
        chainId,
        task.id,
        "in-review"
      );

      expect(result.success).toBe(true);
      expect(result.previousStatus).toBe("in-progress");
      expect(result.newStatus).toBe("in-review");
    });

    it("transitions from in-review to done", async () => {
      const chainId = "CHAIN-001-review-done";
      const task = await taskManager.createTask({
        chainId,
        slug: "review-to-done",
        title: "Review to Done",
        description: "Test",
      });

      await taskManager.transitionTask(chainId, task.id, "todo");
      await taskManager.transitionTask(chainId, task.id, "in-progress");
      await taskManager.transitionTask(chainId, task.id, "in-review");
      const result = await taskManager.transitionTask(chainId, task.id, "done");

      expect(result.success).toBe(true);
      expect(result.previousStatus).toBe("in-review");
      expect(result.newStatus).toBe("done");
    });

    it("completes full lifecycle: backlog → todo → in-progress → in-review → done", async () => {
      const chainId = "CHAIN-001-full-lifecycle";
      const task = await taskManager.createTask({
        chainId,
        slug: "full-lifecycle",
        title: "Full Lifecycle",
        description: "Test complete flow",
      });

      expect(task.status).toBe("backlog");

      const r1 = await taskManager.transitionTask(chainId, task.id, "todo");
      expect(r1.success).toBe(true);
      expect(r1.task.status).toBe("todo");

      const r2 = await taskManager.transitionTask(
        chainId,
        task.id,
        "in-progress"
      );
      expect(r2.success).toBe(true);
      expect(r2.task.status).toBe("in-progress");

      const r3 = await taskManager.transitionTask(chainId, task.id, "in-review");
      expect(r3.success).toBe(true);
      expect(r3.task.status).toBe("in-review");

      const r4 = await taskManager.transitionTask(chainId, task.id, "done");
      expect(r4.success).toBe(true);
      expect(r4.task.status).toBe("done");
    });
  });

  describe("transitionTask - file movement", () => {
    it("moves task file to new status directory", async () => {
      const chainId = "CHAIN-001-file-move";
      const task = await taskManager.createTask({
        chainId,
        slug: "file-move",
        title: "File Move",
        description: "Test file movement",
      });

      const backlogPath = path.join(
        tempDir,
        "docs/tasks/backlog",
        chainId,
        `${task.id}.md`
      );
      const todoPath = path.join(
        tempDir,
        "docs/tasks/todo",
        chainId,
        `${task.id}.md`
      );

      // Verify file exists in backlog
      await fs.access(backlogPath);

      await taskManager.transitionTask(chainId, task.id, "todo");

      // Verify file moved to todo
      await fs.access(todoPath);

      // Verify file removed from backlog
      await expect(fs.access(backlogPath)).rejects.toThrow();
    });

    it("creates destination directory if needed", async () => {
      const chainId = "CHAIN-001-create-dir";
      const task = await taskManager.createTask({
        chainId,
        slug: "create-dir",
        title: "Create Dir",
        description: "Test",
      });

      const todoDir = path.join(tempDir, "docs/tasks/todo", chainId);

      // Directory should not exist yet
      await expect(fs.access(todoDir)).rejects.toThrow();

      await taskManager.transitionTask(chainId, task.id, "todo");

      // Directory should now exist
      const stat = await fs.stat(todoDir);
      expect(stat.isDirectory()).toBe(true);
    });

    it("cleans up empty source directory after move", async () => {
      const chainId = "CHAIN-001-cleanup";
      const task = await taskManager.createTask({
        chainId,
        slug: "cleanup-test",
        title: "Cleanup Test",
        description: "Test",
      });

      const backlogChainDir = path.join(
        tempDir,
        "docs/tasks/backlog",
        chainId
      );

      // Directory exists with the task
      await fs.access(backlogChainDir);

      await taskManager.transitionTask(chainId, task.id, "todo");

      // Directory should be cleaned up (empty)
      await expect(fs.access(backlogChainDir)).rejects.toThrow();
    });

    it("does not clean up directory if other tasks remain", async () => {
      const chainId = "CHAIN-001-no-cleanup";
      const task1 = await taskManager.createTask({
        chainId,
        slug: "task-one",
        title: "Task One",
        description: "First",
      });
      await taskManager.createTask({
        chainId,
        slug: "task-two",
        title: "Task Two",
        description: "Second",
      });

      const backlogChainDir = path.join(
        tempDir,
        "docs/tasks/backlog",
        chainId
      );

      await taskManager.transitionTask(chainId, task1.id, "todo");

      // Directory should still exist (task2 is still there)
      const stat = await fs.stat(backlogChainDir);
      expect(stat.isDirectory()).toBe(true);
    });
  });

  describe("transitionTask - error cases", () => {
    it("fails for non-existent task", async () => {
      const result = await taskManager.transitionTask(
        "CHAIN-001-fake",
        "001-nonexistent",
        "todo"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("fails for invalid transition from backlog to in-progress", async () => {
      const chainId = "CHAIN-001-invalid";
      const task = await taskManager.createTask({
        chainId,
        slug: "invalid-transition",
        title: "Invalid Transition",
        description: "Test",
      });

      const result = await taskManager.transitionTask(
        chainId,
        task.id,
        "in-progress"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot transition");
      expect(result.error).toContain("backlog");
      expect(result.error).toContain("in-progress");
    });

    it("fails for invalid transition from backlog to done", async () => {
      const chainId = "CHAIN-001-skip-done";
      const task = await taskManager.createTask({
        chainId,
        slug: "skip-to-done",
        title: "Skip to Done",
        description: "Test",
      });

      const result = await taskManager.transitionTask(chainId, task.id, "done");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot transition");
    });

    it("fails for transition from done (terminal state)", async () => {
      const chainId = "CHAIN-001-terminal";
      const task = await taskManager.createTask({
        chainId,
        slug: "terminal-state",
        title: "Terminal State",
        description: "Test",
      });

      // Move to done
      await taskManager.transitionTask(chainId, task.id, "todo");
      await taskManager.transitionTask(chainId, task.id, "in-progress");
      await taskManager.transitionTask(chainId, task.id, "in-review");
      await taskManager.transitionTask(chainId, task.id, "done");

      // Try to transition from done
      const result = await taskManager.transitionTask(
        chainId,
        task.id,
        "in-progress"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot transition");
    });

    it("validates all allowed transitions per STATUS_TRANSITIONS", async () => {
      // Verify the STATUS_TRANSITIONS constant is correctly defined
      expect(STATUS_TRANSITIONS.backlog).toContain("todo");
      expect(STATUS_TRANSITIONS.backlog).toContain("blocked");
      expect(STATUS_TRANSITIONS.todo).toContain("in-progress");
      expect(STATUS_TRANSITIONS.todo).toContain("blocked");
      expect(STATUS_TRANSITIONS["in-progress"]).toContain("in-review");
      expect(STATUS_TRANSITIONS["in-progress"]).toContain("blocked");
      expect(STATUS_TRANSITIONS["in-progress"]).toContain("todo");
      expect(STATUS_TRANSITIONS["in-review"]).toContain("done");
      expect(STATUS_TRANSITIONS["in-review"]).toContain("in-progress");
      expect(STATUS_TRANSITIONS["in-review"]).toContain("blocked");
      expect(STATUS_TRANSITIONS.done).toEqual([]);
      expect(STATUS_TRANSITIONS.blocked).toContain("todo");
      expect(STATUS_TRANSITIONS.blocked).toContain("backlog");
    });
  });

  describe("convenience methods", () => {
    it("startTask moves from todo to in-progress", async () => {
      const chainId = "CHAIN-001-start";
      const task = await taskManager.createTask({
        chainId,
        slug: "start-task",
        title: "Start Task",
        description: "Test",
      });

      await taskManager.transitionTask(chainId, task.id, "todo");
      const result = await taskManager.startTask(chainId, task.id);

      expect(result.success).toBe(true);
      expect(result.task.status).toBe("in-progress");
    });

    it("completeTask moves from in-progress to in-review", async () => {
      const chainId = "CHAIN-001-complete";
      const task = await taskManager.createTask({
        chainId,
        slug: "complete-task",
        title: "Complete Task",
        description: "Test",
      });

      await taskManager.transitionTask(chainId, task.id, "todo");
      await taskManager.transitionTask(chainId, task.id, "in-progress");
      const result = await taskManager.completeTask(chainId, task.id);

      expect(result.success).toBe(true);
      expect(result.task.status).toBe("in-review");
    });

    it("approveTask moves from in-review to done", async () => {
      const chainId = "CHAIN-001-approve";
      const task = await taskManager.createTask({
        chainId,
        slug: "approve-task",
        title: "Approve Task",
        description: "Test",
      });

      await taskManager.transitionTask(chainId, task.id, "todo");
      await taskManager.transitionTask(chainId, task.id, "in-progress");
      await taskManager.transitionTask(chainId, task.id, "in-review");
      const result = await taskManager.approveTask(chainId, task.id);

      expect(result.success).toBe(true);
      expect(result.task.status).toBe("done");
    });

    it("reworkTask moves from in-review to in-progress", async () => {
      const chainId = "CHAIN-001-rework";
      const task = await taskManager.createTask({
        chainId,
        slug: "rework-task",
        title: "Rework Task",
        description: "Test",
      });

      await taskManager.transitionTask(chainId, task.id, "todo");
      await taskManager.transitionTask(chainId, task.id, "in-progress");
      await taskManager.transitionTask(chainId, task.id, "in-review");
      const result = await taskManager.reworkTask(chainId, task.id);

      expect(result.success).toBe(true);
      expect(result.task.status).toBe("in-progress");
    });

    it("blockTask moves task to blocked", async () => {
      const chainId = "CHAIN-001-block";
      const task = await taskManager.createTask({
        chainId,
        slug: "block-task",
        title: "Block Task",
        description: "Test",
      });

      await taskManager.transitionTask(chainId, task.id, "todo");
      const result = await taskManager.blockTask(chainId, task.id);

      expect(result.success).toBe(true);
      expect(result.task.status).toBe("blocked");
    });
  });

  describe("getNextTask", () => {
    it("returns null for chain with no tasks", async () => {
      const next = await taskManager.getNextTask("CHAIN-001-empty");
      expect(next).toBeNull();
    });

    it("returns in-progress task if one exists", async () => {
      const chainId = "CHAIN-001-next-progress";
      const task1 = await taskManager.createTask({
        chainId,
        slug: "task-one",
        title: "Task One",
        description: "First",
      });
      await taskManager.createTask({
        chainId,
        slug: "task-two",
        title: "Task Two",
        description: "Second",
      });

      await taskManager.transitionTask(chainId, task1.id, "todo");
      await taskManager.transitionTask(chainId, task1.id, "in-progress");

      const next = await taskManager.getNextTask(chainId);
      expect(next).not.toBeNull();
      expect(next!.id).toBe(task1.id);
      expect(next!.status).toBe("in-progress");
    });

    it("returns first todo task if no in-progress", async () => {
      const chainId = "CHAIN-001-next-todo";
      const task1 = await taskManager.createTask({
        chainId,
        slug: "task-one",
        title: "Task One",
        description: "First",
      });
      const task2 = await taskManager.createTask({
        chainId,
        slug: "task-two",
        title: "Task Two",
        description: "Second",
      });

      await taskManager.transitionTask(chainId, task1.id, "todo");
      await taskManager.transitionTask(chainId, task2.id, "todo");

      const next = await taskManager.getNextTask(chainId);
      expect(next).not.toBeNull();
      expect(next!.id).toBe(task1.id);
      expect(next!.status).toBe("todo");
    });

    it("returns null if all tasks are done or backlog", async () => {
      const chainId = "CHAIN-001-next-none";
      await taskManager.createTask({
        chainId,
        slug: "backlog-task",
        title: "Backlog Task",
        description: "In backlog",
      });

      const next = await taskManager.getNextTask(chainId);
      expect(next).toBeNull();
    });
  });

  describe("updateTask", () => {
    it("updates task title", async () => {
      const chainId = "CHAIN-001-update";
      const task = await taskManager.createTask({
        chainId,
        slug: "update-title",
        title: "Original Title",
        description: "Test",
      });

      const updated = await taskManager.updateTask(chainId, task.id, {
        title: "New Title",
      });

      expect(updated).not.toBeNull();
      expect(updated!.title).toBe("New Title");
    });

    it("updates task description", async () => {
      const chainId = "CHAIN-001-update-desc";
      const task = await taskManager.createTask({
        chainId,
        slug: "update-desc",
        title: "Update Desc",
        description: "Original description",
      });

      const updated = await taskManager.updateTask(chainId, task.id, {
        description: "New description",
      });

      expect(updated).not.toBeNull();
      expect(updated!.description).toBe("New description");
    });

    it("updates multiple fields at once", async () => {
      const chainId = "CHAIN-001-update-multi";
      const task = await taskManager.createTask({
        chainId,
        slug: "update-multi",
        title: "Original",
        description: "Original",
      });

      const updated = await taskManager.updateTask(chainId, task.id, {
        title: "New Title",
        description: "New Description",
        expectedFiles: ["new-file.ts"],
        acceptance: ["New criteria"],
        constraints: ["New constraint"],
        notes: "New notes",
      });

      expect(updated).not.toBeNull();
      expect(updated!.title).toBe("New Title");
      expect(updated!.description).toBe("New Description");
      expect(updated!.expectedFiles).toEqual(["new-file.ts"]);
      expect(updated!.acceptance).toEqual(["New criteria"]);
      expect(updated!.constraints).toEqual(["New constraint"]);
      expect(updated!.notes).toBe("New notes");
    });

    it("returns null for non-existent task", async () => {
      const updated = await taskManager.updateTask(
        "CHAIN-001-fake",
        "001-nonexistent",
        { title: "New Title" }
      );

      expect(updated).toBeNull();
    });

    it("persists updates to file", async () => {
      const chainId = "CHAIN-001-persist";
      const task = await taskManager.createTask({
        chainId,
        slug: "persist-update",
        title: "Original",
        description: "Test",
      });

      await taskManager.updateTask(chainId, task.id, {
        title: "Persisted Title",
      });

      // Re-read from disk
      const loaded = await taskManager.getTask(chainId, task.id);
      expect(loaded!.title).toBe("Persisted Title");
    });

    it("updates updatedAt timestamp", async () => {
      const chainId = "CHAIN-001-timestamp";
      const task = await taskManager.createTask({
        chainId,
        slug: "timestamp",
        title: "Timestamp Test",
        description: "Test",
      });

      const originalUpdatedAt = task.updatedAt;

      // Small delay to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await taskManager.updateTask(chainId, task.id, {
        title: "Updated",
      });

      expect(updated!.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe("deleteTask", () => {
    it("deletes an existing task", async () => {
      const chainId = "CHAIN-001-delete";
      const task = await taskManager.createTask({
        chainId,
        slug: "delete-me",
        title: "Delete Me",
        description: "Test",
      });

      const result = await taskManager.deleteTask(chainId, task.id);
      expect(result).toBe(true);

      const retrieved = await taskManager.getTask(chainId, task.id);
      expect(retrieved).toBeNull();
    });

    it("returns false for non-existent task", async () => {
      const result = await taskManager.deleteTask(
        "CHAIN-001-fake",
        "001-nonexistent"
      );
      expect(result).toBe(false);
    });

    it("removes task file from disk", async () => {
      const chainId = "CHAIN-001-delete-file";
      const task = await taskManager.createTask({
        chainId,
        slug: "delete-file",
        title: "Delete File",
        description: "Test",
      });

      const taskPath = path.join(
        tempDir,
        "docs/tasks/backlog",
        chainId,
        `${task.id}.md`
      );

      // Verify file exists
      await fs.access(taskPath);

      await taskManager.deleteTask(chainId, task.id);

      // Verify file is gone
      await expect(fs.access(taskPath)).rejects.toThrow();
    });

    it("cleans up empty chain directory", async () => {
      const chainId = "CHAIN-001-delete-cleanup";
      const task = await taskManager.createTask({
        chainId,
        slug: "cleanup",
        title: "Cleanup",
        description: "Test",
      });

      const chainDir = path.join(tempDir, "docs/tasks/backlog", chainId);

      await taskManager.deleteTask(chainId, task.id);

      // Directory should be cleaned up
      await expect(fs.access(chainDir)).rejects.toThrow();
    });
  });

  describe("blocked status handling", () => {
    it("can block a task from todo", async () => {
      const chainId = "CHAIN-001-block-todo";
      const task = await taskManager.createTask({
        chainId,
        slug: "block-from-todo",
        title: "Block from Todo",
        description: "Test",
      });

      await taskManager.transitionTask(chainId, task.id, "todo");
      const result = await taskManager.transitionTask(
        chainId,
        task.id,
        "blocked"
      );

      expect(result.success).toBe(true);
      expect(result.task.status).toBe("blocked");
    });

    it("can block a task from in-progress", async () => {
      const chainId = "CHAIN-001-block-progress";
      const task = await taskManager.createTask({
        chainId,
        slug: "block-from-progress",
        title: "Block from Progress",
        description: "Test",
      });

      await taskManager.transitionTask(chainId, task.id, "todo");
      await taskManager.transitionTask(chainId, task.id, "in-progress");
      const result = await taskManager.transitionTask(
        chainId,
        task.id,
        "blocked"
      );

      expect(result.success).toBe(true);
      expect(result.task.status).toBe("blocked");
    });

    it("can unblock a task to todo", async () => {
      const chainId = "CHAIN-001-unblock-todo";
      const task = await taskManager.createTask({
        chainId,
        slug: "unblock-to-todo",
        title: "Unblock to Todo",
        description: "Test",
      });

      await taskManager.transitionTask(chainId, task.id, "todo");
      await taskManager.transitionTask(chainId, task.id, "blocked");
      const result = await taskManager.transitionTask(chainId, task.id, "todo");

      expect(result.success).toBe(true);
      expect(result.task.status).toBe("todo");
    });

    it("can unblock a task to backlog", async () => {
      const chainId = "CHAIN-001-unblock-backlog";
      const task = await taskManager.createTask({
        chainId,
        slug: "unblock-to-backlog",
        title: "Unblock to Backlog",
        description: "Test",
      });

      await taskManager.transitionTask(chainId, task.id, "todo");
      await taskManager.transitionTask(chainId, task.id, "blocked");
      const result = await taskManager.transitionTask(
        chainId,
        task.id,
        "backlog"
      );

      expect(result.success).toBe(true);
      expect(result.task.status).toBe("backlog");
    });
  });

  describe("custom config", () => {
    it("uses custom tasks path", async () => {
      const customManager = new TaskManager(tempDir, {
        tasksPath: "custom/tasks",
      });

      const task = await customManager.createTask({
        chainId: "CHAIN-001-custom",
        slug: "custom-path",
        title: "Custom Path",
        description: "Test",
      });

      const taskPath = path.join(
        tempDir,
        "custom/tasks/backlog",
        task.chainId,
        `${task.id}.md`
      );
      const stat = await fs.stat(taskPath);
      expect(stat.isFile()).toBe(true);
    });
  });
});
