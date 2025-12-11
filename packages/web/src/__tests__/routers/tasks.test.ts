/**
 * @design-doc docs/design/core/features/web-api.md
 * @user-intent "Verify tasks router correctly calls TaskManager and handles status transitions"
 * @test-type unit
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCallerFactory } from "@/server/trpc";
import { appRouter } from "@/server/routers";
import { TRPCError } from "@trpc/server";

// Mock @choragen/core
vi.mock("@choragen/core", () => ({
  TaskManager: vi.fn().mockImplementation(() => mockTaskManager),
  // Re-export ChainManager mock for chains router (used by appRouter)
  ChainManager: vi.fn().mockImplementation(() => ({})),
  WorkflowManager: vi.fn().mockImplementation(() => ({})),
  WORKFLOW_STATUSES: ["active", "paused", "completed", "failed", "cancelled"] as const,
  MESSAGE_ROLES: ["human", "control", "impl", "system"] as const,
  loadTemplate: vi.fn(),
}));

// Mock task manager instance
const mockTaskManager = {
  getTask: vi.fn(),
  getTasksForChain: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  transitionTask: vi.fn(),
  startTask: vi.fn(),
  completeTask: vi.fn(),
  approveTask: vi.fn(),
  reworkTask: vi.fn(),
  blockTask: vi.fn(),
  unblockTask: vi.fn(),
};

describe("tasks router", () => {
  const createCaller = createCallerFactory(appRouter);
  const caller = createCaller({ projectRoot: "/tmp/test" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("get", () => {
    it("returns a task by chain and task ID", async () => {
      const mockTask = {
        id: "001-test-task",
        title: "Test Task",
        status: "todo",
      };
      mockTaskManager.getTask.mockResolvedValue(mockTask);

      const result = await caller.tasks.get({
        chainId: "CHAIN-001",
        taskId: "001-test-task",
      });

      expect(result).toEqual(mockTask);
      expect(mockTaskManager.getTask).toHaveBeenCalledWith(
        "CHAIN-001",
        "001-test-task"
      );
    });

    it("throws NOT_FOUND when task does not exist", async () => {
      mockTaskManager.getTask.mockResolvedValue(null);

      await expect(
        caller.tasks.get({
          chainId: "CHAIN-001",
          taskId: "999-missing",
        })
      ).rejects.toThrow(TRPCError);
      await expect(
        caller.tasks.get({
          chainId: "CHAIN-001",
          taskId: "999-missing",
        })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("listForChain", () => {
    it("returns all tasks for a chain", async () => {
      const mockTasks = [
        { id: "001-task-a", title: "Task A", status: "done" },
        { id: "002-task-b", title: "Task B", status: "in-progress" },
        { id: "003-task-c", title: "Task C", status: "todo" },
      ];
      mockTaskManager.getTasksForChain.mockResolvedValue(mockTasks);

      const result = await caller.tasks.listForChain("CHAIN-001");

      expect(result).toEqual(mockTasks);
      expect(mockTaskManager.getTasksForChain).toHaveBeenCalledWith(
        "CHAIN-001"
      );
    });

    it("returns empty array when chain has no tasks", async () => {
      mockTaskManager.getTasksForChain.mockResolvedValue([]);

      const result = await caller.tasks.listForChain("CHAIN-001");

      expect(result).toEqual([]);
    });
  });

  describe("create", () => {
    it("creates a new task", async () => {
      const input = {
        chainId: "CHAIN-001",
        slug: "new-task",
        title: "New Task",
        description: "Task description",
      };
      const mockCreatedTask = {
        id: "001-new-task",
        ...input,
        status: "backlog",
      };
      mockTaskManager.createTask.mockResolvedValue(mockCreatedTask);

      const result = await caller.tasks.create(input);

      expect(result).toEqual(mockCreatedTask);
      expect(mockTaskManager.createTask).toHaveBeenCalledWith(input);
    });

    it("creates task with optional fields", async () => {
      const input = {
        chainId: "CHAIN-001",
        slug: "new-task",
        title: "New Task",
        description: "Task description",
        expectedFiles: ["src/file.ts"],
        acceptance: ["Criterion 1", "Criterion 2"],
        constraints: ["Must use TypeScript"],
        notes: "Additional notes",
      };
      mockTaskManager.createTask.mockResolvedValue({ id: "001-new-task" });

      await caller.tasks.create(input);

      expect(mockTaskManager.createTask).toHaveBeenCalledWith(input);
    });
  });

  describe("update", () => {
    it("updates task content", async () => {
      const input = {
        chainId: "CHAIN-001",
        taskId: "001-task",
        updates: { title: "Updated Title" },
      };
      const mockUpdatedTask = {
        id: "001-task",
        title: "Updated Title",
      };
      mockTaskManager.updateTask.mockResolvedValue(mockUpdatedTask);

      const result = await caller.tasks.update(input);

      expect(result).toEqual(mockUpdatedTask);
      expect(mockTaskManager.updateTask).toHaveBeenCalledWith(
        "CHAIN-001",
        "001-task",
        input.updates
      );
    });

    it("throws NOT_FOUND when task does not exist", async () => {
      mockTaskManager.updateTask.mockResolvedValue(null);

      await expect(
        caller.tasks.update({
          chainId: "CHAIN-001",
          taskId: "999-missing",
          updates: { title: "New Title" },
        })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("delete", () => {
    it("deletes a task and returns success", async () => {
      mockTaskManager.deleteTask.mockResolvedValue(true);

      const result = await caller.tasks.delete({
        chainId: "CHAIN-001",
        taskId: "001-task",
      });

      expect(result).toEqual({
        success: true,
        chainId: "CHAIN-001",
        taskId: "001-task",
      });
      expect(mockTaskManager.deleteTask).toHaveBeenCalledWith(
        "CHAIN-001",
        "001-task"
      );
    });

    it("throws NOT_FOUND when task does not exist", async () => {
      mockTaskManager.deleteTask.mockResolvedValue(false);

      await expect(
        caller.tasks.delete({
          chainId: "CHAIN-001",
          taskId: "999-missing",
        })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("transition", () => {
    it("transitions task to new status", async () => {
      const mockResult = { success: true, task: { id: "001-task" } };
      mockTaskManager.transitionTask.mockResolvedValue(mockResult);

      const result = await caller.tasks.transition({
        chainId: "CHAIN-001",
        taskId: "001-task",
        newStatus: "in-progress",
      });

      expect(result).toEqual(mockResult);
      expect(mockTaskManager.transitionTask).toHaveBeenCalledWith(
        "CHAIN-001",
        "001-task",
        "in-progress"
      );
    });

    it("throws BAD_REQUEST when transition fails", async () => {
      mockTaskManager.transitionTask.mockResolvedValue({
        success: false,
        error: "Invalid transition",
      });

      await expect(
        caller.tasks.transition({
          chainId: "CHAIN-001",
          taskId: "001-task",
          newStatus: "done",
        })
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });
  });

  describe("start", () => {
    it("starts a task (todo → in-progress)", async () => {
      const mockResult = {
        success: true,
        task: { id: "001-task", status: "in-progress" },
      };
      mockTaskManager.startTask.mockResolvedValue(mockResult);

      const result = await caller.tasks.start({
        chainId: "CHAIN-001",
        taskId: "001-task",
      });

      expect(result).toEqual(mockResult);
      expect(mockTaskManager.startTask).toHaveBeenCalledWith(
        "CHAIN-001",
        "001-task"
      );
    });

    it("throws BAD_REQUEST when start fails", async () => {
      mockTaskManager.startTask.mockResolvedValue({
        success: false,
        error: "Task not in todo status",
      });

      await expect(
        caller.tasks.start({
          chainId: "CHAIN-001",
          taskId: "001-task",
        })
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });
  });

  describe("complete", () => {
    it("completes a task (in-progress → in-review)", async () => {
      const mockResult = {
        success: true,
        task: { id: "001-task", status: "in-review" },
      };
      mockTaskManager.completeTask.mockResolvedValue(mockResult);

      const result = await caller.tasks.complete({
        chainId: "CHAIN-001",
        taskId: "001-task",
      });

      expect(result).toEqual(mockResult);
      expect(mockTaskManager.completeTask).toHaveBeenCalledWith(
        "CHAIN-001",
        "001-task"
      );
    });

    it("throws BAD_REQUEST when complete fails", async () => {
      mockTaskManager.completeTask.mockResolvedValue({
        success: false,
        error: "Task not in-progress",
      });

      await expect(
        caller.tasks.complete({
          chainId: "CHAIN-001",
          taskId: "001-task",
        })
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });
  });

  describe("approve", () => {
    it("approves a task (in-review → done)", async () => {
      const mockResult = {
        success: true,
        task: { id: "001-task", status: "done" },
      };
      mockTaskManager.approveTask.mockResolvedValue(mockResult);

      const result = await caller.tasks.approve({
        chainId: "CHAIN-001",
        taskId: "001-task",
      });

      expect(result).toEqual(mockResult);
      expect(mockTaskManager.approveTask).toHaveBeenCalledWith(
        "CHAIN-001",
        "001-task"
      );
    });

    it("throws BAD_REQUEST when approve fails", async () => {
      mockTaskManager.approveTask.mockResolvedValue({
        success: false,
        error: "Task not in review",
      });

      await expect(
        caller.tasks.approve({
          chainId: "CHAIN-001",
          taskId: "001-task",
        })
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });
  });

  describe("rework", () => {
    it("sends task back for rework (in-review → in-progress)", async () => {
      const mockResult = {
        success: true,
        task: { id: "001-task", status: "in-progress" },
      };
      mockTaskManager.reworkTask.mockResolvedValue(mockResult);

      const result = await caller.tasks.rework({
        chainId: "CHAIN-001",
        taskId: "001-task",
      });

      expect(result).toEqual(mockResult);
      expect(mockTaskManager.reworkTask).toHaveBeenCalledWith(
        "CHAIN-001",
        "001-task",
        undefined
      );
    });

    it("sends task back for rework with reason", async () => {
      const mockResult = { success: true };
      mockTaskManager.reworkTask.mockResolvedValue(mockResult);

      await caller.tasks.rework({
        chainId: "CHAIN-001",
        taskId: "001-task",
        reason: "Needs more tests",
      });

      expect(mockTaskManager.reworkTask).toHaveBeenCalledWith(
        "CHAIN-001",
        "001-task",
        "Needs more tests"
      );
    });

    it("throws BAD_REQUEST when rework fails", async () => {
      mockTaskManager.reworkTask.mockResolvedValue({
        success: false,
        error: "Task not in review",
      });

      await expect(
        caller.tasks.rework({
          chainId: "CHAIN-001",
          taskId: "001-task",
        })
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });
  });

  describe("block", () => {
    it("blocks a task", async () => {
      const mockResult = {
        success: true,
        task: { id: "001-task", status: "blocked" },
      };
      mockTaskManager.blockTask.mockResolvedValue(mockResult);

      const result = await caller.tasks.block({
        chainId: "CHAIN-001",
        taskId: "001-task",
      });

      expect(result).toEqual(mockResult);
      expect(mockTaskManager.blockTask).toHaveBeenCalledWith(
        "CHAIN-001",
        "001-task"
      );
    });

    it("throws BAD_REQUEST when block fails", async () => {
      mockTaskManager.blockTask.mockResolvedValue({
        success: false,
        error: "Cannot block done task",
      });

      await expect(
        caller.tasks.block({
          chainId: "CHAIN-001",
          taskId: "001-task",
        })
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });
  });

  describe("unblock", () => {
    it("unblocks a task (blocked → todo)", async () => {
      const mockResult = {
        success: true,
        task: { id: "001-task", status: "todo" },
      };
      mockTaskManager.unblockTask.mockResolvedValue(mockResult);

      const result = await caller.tasks.unblock({
        chainId: "CHAIN-001",
        taskId: "001-task",
      });

      expect(result).toEqual(mockResult);
      expect(mockTaskManager.unblockTask).toHaveBeenCalledWith(
        "CHAIN-001",
        "001-task"
      );
    });

    it("throws BAD_REQUEST when unblock fails", async () => {
      mockTaskManager.unblockTask.mockResolvedValue({
        success: false,
        error: "Task is not blocked",
      });

      await expect(
        caller.tasks.unblock({
          chainId: "CHAIN-001",
          taskId: "001-task",
        })
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });
  });
});
