/**
 * @design-doc docs/design/core/features/web-api.md
 * @user-intent "Verify chains router correctly calls ChainManager and returns expected data"
 * @test-type unit
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCallerFactory } from "@/server/trpc";
import { appRouter } from "@/server/routers";
import { TRPCError } from "@trpc/server";

// Mock @choragen/core
vi.mock("@choragen/core", () => ({
  ChainManager: vi.fn().mockImplementation(() => mockChainManager),
  WorkflowManager: vi.fn().mockImplementation(() => ({})),
  WORKFLOW_STATUSES: ["active", "paused", "completed", "failed", "cancelled"] as const,
  MESSAGE_ROLES: ["human", "control", "impl", "system"] as const,
  loadTemplate: vi.fn(),
}));

// Mock chain manager instance
const mockChainManager = {
  getAllChains: vi.fn(),
  getChain: vi.fn(),
  getChainSummary: vi.fn(),
  createChain: vi.fn(),
  updateChain: vi.fn(),
  deleteChain: vi.fn(),
  addTask: vi.fn(),
  getNextTask: vi.fn(),
};

describe("chains router", () => {
  const createCaller = createCallerFactory(appRouter);
  const caller = createCaller({ projectRoot: "/tmp/test" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("returns all chains from ChainManager", async () => {
      const mockChains = [
        { id: "CHAIN-001", title: "Test Chain 1", status: "in-progress" },
        { id: "CHAIN-002", title: "Test Chain 2", status: "done" },
      ];
      mockChainManager.getAllChains.mockResolvedValue(mockChains);

      const result = await caller.chains.list();

      expect(result).toEqual(mockChains);
      expect(mockChainManager.getAllChains).toHaveBeenCalledOnce();
    });

    it("returns empty array when no chains exist", async () => {
      mockChainManager.getAllChains.mockResolvedValue([]);

      const result = await caller.chains.list();

      expect(result).toEqual([]);
    });
  });

  describe("get", () => {
    it("returns a chain by ID", async () => {
      const mockChain = {
        id: "CHAIN-001",
        title: "Test Chain",
        status: "in-progress",
      };
      mockChainManager.getChain.mockResolvedValue(mockChain);

      const result = await caller.chains.get("CHAIN-001");

      expect(result).toEqual(mockChain);
      expect(mockChainManager.getChain).toHaveBeenCalledWith("CHAIN-001");
    });

    it("throws NOT_FOUND when chain does not exist", async () => {
      mockChainManager.getChain.mockResolvedValue(null);

      await expect(caller.chains.get("CHAIN-999")).rejects.toThrow(TRPCError);
      await expect(caller.chains.get("CHAIN-999")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("getSummary", () => {
    it("returns chain summary with task counts", async () => {
      const mockSummary = {
        id: "CHAIN-001",
        title: "Test Chain",
        taskCount: 5,
        completedCount: 2,
        progress: 40,
      };
      mockChainManager.getChainSummary.mockResolvedValue(mockSummary);

      const result = await caller.chains.getSummary("CHAIN-001");

      expect(result).toEqual(mockSummary);
      expect(mockChainManager.getChainSummary).toHaveBeenCalledWith(
        "CHAIN-001"
      );
    });

    it("throws NOT_FOUND when chain does not exist", async () => {
      mockChainManager.getChainSummary.mockResolvedValue(null);

      await expect(caller.chains.getSummary("CHAIN-999")).rejects.toThrow(
        TRPCError
      );
      await expect(caller.chains.getSummary("CHAIN-999")).rejects.toMatchObject(
        {
          code: "NOT_FOUND",
        }
      );
    });
  });

  describe("create", () => {
    it("creates a new chain", async () => {
      const input = {
        requestId: "CR-20251208-001",
        slug: "test-chain",
        title: "Test Chain",
      };
      const mockCreatedChain = {
        id: "CHAIN-001",
        ...input,
        status: "in-progress",
      };
      mockChainManager.createChain.mockResolvedValue(mockCreatedChain);

      const result = await caller.chains.create(input);

      expect(result).toEqual(mockCreatedChain);
      expect(mockChainManager.createChain).toHaveBeenCalledWith(input);
    });

    it("creates chain with optional fields", async () => {
      const input = {
        requestId: "CR-20251208-001",
        slug: "test-chain",
        title: "Test Chain",
        description: "A test chain",
        type: "implementation" as const,
        dependsOn: "CHAIN-000",
      };
      mockChainManager.createChain.mockResolvedValue({ id: "CHAIN-001" });

      await caller.chains.create(input);

      expect(mockChainManager.createChain).toHaveBeenCalledWith(input);
    });
  });

  describe("update", () => {
    it("updates chain metadata", async () => {
      const input = {
        chainId: "CHAIN-001",
        updates: { title: "Updated Title" },
      };
      const mockUpdatedChain = {
        id: "CHAIN-001",
        title: "Updated Title",
      };
      mockChainManager.updateChain.mockResolvedValue(mockUpdatedChain);

      const result = await caller.chains.update(input);

      expect(result).toEqual(mockUpdatedChain);
      expect(mockChainManager.updateChain).toHaveBeenCalledWith(
        "CHAIN-001",
        input.updates
      );
    });

    it("throws NOT_FOUND when chain does not exist", async () => {
      mockChainManager.updateChain.mockResolvedValue(null);

      await expect(
        caller.chains.update({
          chainId: "CHAIN-999",
          updates: { title: "New Title" },
        })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("delete", () => {
    it("deletes a chain and returns success", async () => {
      mockChainManager.deleteChain.mockResolvedValue(true);

      const result = await caller.chains.delete("CHAIN-001");

      expect(result).toEqual({ success: true, chainId: "CHAIN-001" });
      expect(mockChainManager.deleteChain).toHaveBeenCalledWith("CHAIN-001");
    });

    it("throws NOT_FOUND when chain does not exist", async () => {
      mockChainManager.deleteChain.mockResolvedValue(false);

      await expect(caller.chains.delete("CHAIN-999")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("addTask", () => {
    it("adds a task to a chain", async () => {
      const input = {
        chainId: "CHAIN-001",
        slug: "new-task",
        title: "New Task",
        description: "Task description",
      };
      const mockTask = { id: "001-new-task", ...input };
      mockChainManager.getChain.mockResolvedValue({ id: "CHAIN-001" });
      mockChainManager.addTask.mockResolvedValue(mockTask);

      const result = await caller.chains.addTask(input);

      expect(result).toEqual(mockTask);
      expect(mockChainManager.addTask).toHaveBeenCalledWith("CHAIN-001", {
        slug: "new-task",
        title: "New Task",
        description: "Task description",
      });
    });

    it("throws NOT_FOUND when chain does not exist", async () => {
      mockChainManager.getChain.mockResolvedValue(null);

      await expect(
        caller.chains.addTask({
          chainId: "CHAIN-999",
          slug: "task",
          title: "Task",
          description: "Desc",
        })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("getNextTask", () => {
    it("returns the next available task", async () => {
      const mockTask = {
        id: "002-next-task",
        title: "Next Task",
        status: "todo",
      };
      mockChainManager.getChain.mockResolvedValue({ id: "CHAIN-001" });
      mockChainManager.getNextTask.mockResolvedValue(mockTask);

      const result = await caller.chains.getNextTask("CHAIN-001");

      expect(result).toEqual(mockTask);
      expect(mockChainManager.getNextTask).toHaveBeenCalledWith("CHAIN-001");
    });

    it("returns null when no tasks available", async () => {
      mockChainManager.getChain.mockResolvedValue({ id: "CHAIN-001" });
      mockChainManager.getNextTask.mockResolvedValue(null);

      const result = await caller.chains.getNextTask("CHAIN-001");

      expect(result).toBeNull();
    });

    it("throws NOT_FOUND when chain does not exist", async () => {
      mockChainManager.getChain.mockResolvedValue(null);

      await expect(
        caller.chains.getNextTask("CHAIN-999")
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });
});
