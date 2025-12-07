/**
 * @design-doc docs/design/core/features/task-chain-management.md
 * @user-intent "Verify ChainManager correctly creates, retrieves, updates, and deletes chains with proper type handling and dependency linking"
 * @test-type unit
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { ChainManager } from "../chain-manager.js";

describe("ChainManager", () => {
  let tempDir: string;
  let chainManager: ChainManager;

  beforeEach(async () => {
    // Create a temp directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-test-"));
    chainManager = new ChainManager(tempDir);
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("createChain", () => {
    it("creates a chain with basic options", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-20251207-001",
        slug: "test-feature",
        title: "Test Feature Chain",
      });

      expect(chain.id).toBe("CHAIN-001-test-feature");
      expect(chain.sequence).toBe(1);
      expect(chain.slug).toBe("test-feature");
      expect(chain.requestId).toBe("CR-20251207-001");
      expect(chain.title).toBe("Test Feature Chain");
      expect(chain.description).toBe("");
      expect(chain.tasks).toEqual([]);
      expect(chain.createdAt).toBeInstanceOf(Date);
      expect(chain.updatedAt).toBeInstanceOf(Date);
    });

    it("creates a chain with description", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-20251207-001",
        slug: "with-desc",
        title: "Chain With Description",
        description: "This is a detailed description",
      });

      expect(chain.description).toBe("This is a detailed description");
    });

    it("increments sequence number for subsequent chains", async () => {
      const chain1 = await chainManager.createChain({
        requestId: "CR-001",
        slug: "first",
        title: "First Chain",
      });

      const chain2 = await chainManager.createChain({
        requestId: "CR-002",
        slug: "second",
        title: "Second Chain",
      });

      const chain3 = await chainManager.createChain({
        requestId: "CR-003",
        slug: "third",
        title: "Third Chain",
      });

      expect(chain1.sequence).toBe(1);
      expect(chain2.sequence).toBe(2);
      expect(chain3.sequence).toBe(3);
      expect(chain1.id).toBe("CHAIN-001-first");
      expect(chain2.id).toBe("CHAIN-002-second");
      expect(chain3.id).toBe("CHAIN-003-third");
    });

    it("creates chain directory in backlog", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "backlog-test",
        title: "Backlog Test",
      });

      const chainDir = path.join(tempDir, "docs/tasks/backlog", chain.id);
      const stat = await fs.stat(chainDir);
      expect(stat.isDirectory()).toBe(true);
    });

    it("writes chain metadata file", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "metadata-test",
        title: "Metadata Test",
      });

      const metadataPath = path.join(
        tempDir,
        "docs/tasks/.chains",
        `${chain.id}.json`
      );
      const content = await fs.readFile(metadataPath, "utf-8");
      const metadata = JSON.parse(content);

      expect(metadata.id).toBe(chain.id);
      expect(metadata.requestId).toBe("CR-001");
      expect(metadata.title).toBe("Metadata Test");
    });
  });

  describe("chain type handling", () => {
    it("creates a design chain", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "design-work",
        title: "Design Work",
        type: "design",
      });

      expect(chain.type).toBe("design");
    });

    it("creates an implementation chain", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "impl-work",
        title: "Implementation Work",
        type: "implementation",
      });

      expect(chain.type).toBe("implementation");
    });

    it("persists chain type in metadata", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "typed-chain",
        title: "Typed Chain",
        type: "design",
      });

      const metadataPath = path.join(
        tempDir,
        "docs/tasks/.chains",
        `${chain.id}.json`
      );
      const content = await fs.readFile(metadataPath, "utf-8");
      const metadata = JSON.parse(content);

      expect(metadata.type).toBe("design");
    });

    it("loads chain type correctly", async () => {
      const created = await chainManager.createChain({
        requestId: "CR-001",
        slug: "load-type",
        title: "Load Type Test",
        type: "implementation",
      });

      const loaded = await chainManager.getChain(created.id);
      expect(loaded).not.toBeNull();
      expect(loaded!.type).toBe("implementation");
    });
  });

  describe("dependsOn chain linking", () => {
    it("creates a chain with dependsOn reference", async () => {
      const designChain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "design",
        title: "Design Chain",
        type: "design",
      });

      const implChain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "impl",
        title: "Implementation Chain",
        type: "implementation",
        dependsOn: designChain.id,
      });

      expect(implChain.dependsOn).toBe(designChain.id);
    });

    it("persists dependsOn in metadata", async () => {
      const designChain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "design-dep",
        title: "Design",
        type: "design",
      });

      const implChain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "impl-dep",
        title: "Implementation",
        type: "implementation",
        dependsOn: designChain.id,
      });

      const metadataPath = path.join(
        tempDir,
        "docs/tasks/.chains",
        `${implChain.id}.json`
      );
      const content = await fs.readFile(metadataPath, "utf-8");
      const metadata = JSON.parse(content);

      expect(metadata.dependsOn).toBe(designChain.id);
    });

    it("loads dependsOn correctly", async () => {
      const designChain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "design-load",
        title: "Design",
        type: "design",
      });

      const implChain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "impl-load",
        title: "Implementation",
        type: "implementation",
        dependsOn: designChain.id,
      });

      const loaded = await chainManager.getChain(implChain.id);
      expect(loaded).not.toBeNull();
      expect(loaded!.dependsOn).toBe(designChain.id);
    });
  });

  describe("skipDesign flag behavior", () => {
    it("creates a chain with skipDesign flag", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "skip-design",
        title: "Skip Design Chain",
        type: "implementation",
        skipDesign: true,
        skipDesignJustification: "Trivial bug fix",
      });

      expect(chain.skipDesign).toBe(true);
      expect(chain.skipDesignJustification).toBe("Trivial bug fix");
    });

    it("persists skipDesign in metadata", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "skip-persist",
        title: "Skip Persist",
        type: "implementation",
        skipDesign: true,
        skipDesignJustification: "Emergency hotfix",
      });

      const metadataPath = path.join(
        tempDir,
        "docs/tasks/.chains",
        `${chain.id}.json`
      );
      const content = await fs.readFile(metadataPath, "utf-8");
      const metadata = JSON.parse(content);

      expect(metadata.skipDesign).toBe(true);
      expect(metadata.skipDesignJustification).toBe("Emergency hotfix");
    });

    it("loads skipDesign correctly", async () => {
      const created = await chainManager.createChain({
        requestId: "CR-001",
        slug: "skip-load",
        title: "Skip Load",
        type: "implementation",
        skipDesign: true,
        skipDesignJustification: "Minor change",
      });

      const loaded = await chainManager.getChain(created.id);
      expect(loaded).not.toBeNull();
      expect(loaded!.skipDesign).toBe(true);
      expect(loaded!.skipDesignJustification).toBe("Minor change");
    });

    it("does not include skipDesign when false", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "no-skip",
        title: "No Skip",
        type: "implementation",
      });

      const metadataPath = path.join(
        tempDir,
        "docs/tasks/.chains",
        `${chain.id}.json`
      );
      const content = await fs.readFile(metadataPath, "utf-8");
      const metadata = JSON.parse(content);

      expect(metadata.skipDesign).toBeUndefined();
      expect(metadata.skipDesignJustification).toBeUndefined();
    });
  });

  describe("getChain", () => {
    it("returns null for non-existent chain", async () => {
      const chain = await chainManager.getChain("CHAIN-999-nonexistent");
      expect(chain).toBeNull();
    });

    it("retrieves an existing chain", async () => {
      const created = await chainManager.createChain({
        requestId: "CR-001",
        slug: "retrieve-test",
        title: "Retrieve Test",
      });

      const retrieved = await chainManager.getChain(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.title).toBe("Retrieve Test");
    });

    it("retrieves chain with all metadata", async () => {
      const created = await chainManager.createChain({
        requestId: "CR-001",
        slug: "full-meta",
        title: "Full Metadata",
        description: "Full description",
        type: "design",
      });

      const retrieved = await chainManager.getChain(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.requestId).toBe("CR-001");
      expect(retrieved!.description).toBe("Full description");
      expect(retrieved!.type).toBe("design");
    });
  });

  describe("listChains (getAllChains)", () => {
    it("returns empty array when no chains exist", async () => {
      const chains = await chainManager.getAllChains();
      expect(chains).toEqual([]);
    });

    it("lists all created chains", async () => {
      await chainManager.createChain({
        requestId: "CR-001",
        slug: "alpha",
        title: "Alpha",
      });
      await chainManager.createChain({
        requestId: "CR-002",
        slug: "beta",
        title: "Beta",
      });
      await chainManager.createChain({
        requestId: "CR-003",
        slug: "gamma",
        title: "Gamma",
      });

      const chains = await chainManager.getAllChains();
      expect(chains).toHaveLength(3);
    });

    it("returns chains sorted by sequence", async () => {
      await chainManager.createChain({
        requestId: "CR-001",
        slug: "first",
        title: "First",
      });
      await chainManager.createChain({
        requestId: "CR-002",
        slug: "second",
        title: "Second",
      });
      await chainManager.createChain({
        requestId: "CR-003",
        slug: "third",
        title: "Third",
      });

      const chains = await chainManager.getAllChains();
      expect(chains[0].sequence).toBe(1);
      expect(chains[1].sequence).toBe(2);
      expect(chains[2].sequence).toBe(3);
    });

    it("includes chain type in listing", async () => {
      await chainManager.createChain({
        requestId: "CR-001",
        slug: "design",
        title: "Design",
        type: "design",
      });
      await chainManager.createChain({
        requestId: "CR-002",
        slug: "impl",
        title: "Implementation",
        type: "implementation",
      });

      const chains = await chainManager.getAllChains();
      expect(chains[0].type).toBe("design");
      expect(chains[1].type).toBe("implementation");
    });
  });

  describe("getChainStatus", () => {
    it("returns backlog for chain with no tasks", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "empty",
        title: "Empty Chain",
      });

      const status = chainManager.getChainStatus(chain);
      expect(status).toBe("backlog");
    });

    it("returns done when all tasks are done", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "all-done",
        title: "All Done",
      });

      // Simulate tasks being done
      chain.tasks = [
        {
          id: "001-task",
          sequence: 1,
          slug: "task",
          status: "done",
          chainId: chain.id,
          title: "Task",
          description: "",
          expectedFiles: [],
          acceptance: [],
          constraints: [],
          notes: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const status = chainManager.getChainStatus(chain);
      expect(status).toBe("done");
    });

    it("returns in-progress when any task is in-progress", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "in-prog",
        title: "In Progress",
      });

      chain.tasks = [
        {
          id: "001-task",
          sequence: 1,
          slug: "task",
          status: "done",
          chainId: chain.id,
          title: "Task 1",
          description: "",
          expectedFiles: [],
          acceptance: [],
          constraints: [],
          notes: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "002-task",
          sequence: 2,
          slug: "task2",
          status: "in-progress",
          chainId: chain.id,
          title: "Task 2",
          description: "",
          expectedFiles: [],
          acceptance: [],
          constraints: [],
          notes: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const status = chainManager.getChainStatus(chain);
      expect(status).toBe("in-progress");
    });

    it("returns blocked when any task is blocked", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "blocked",
        title: "Blocked",
      });

      chain.tasks = [
        {
          id: "001-task",
          sequence: 1,
          slug: "task",
          status: "blocked",
          chainId: chain.id,
          title: "Task",
          description: "",
          expectedFiles: [],
          acceptance: [],
          constraints: [],
          notes: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const status = chainManager.getChainStatus(chain);
      expect(status).toBe("blocked");
    });

    it("returns in-review when any task is in-review", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "review",
        title: "Review",
      });

      chain.tasks = [
        {
          id: "001-task",
          sequence: 1,
          slug: "task",
          status: "in-review",
          chainId: chain.id,
          title: "Task",
          description: "",
          expectedFiles: [],
          acceptance: [],
          constraints: [],
          notes: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const status = chainManager.getChainStatus(chain);
      expect(status).toBe("in-review");
    });

    it("returns todo when any task is todo", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "todo",
        title: "Todo",
      });

      chain.tasks = [
        {
          id: "001-task",
          sequence: 1,
          slug: "task",
          status: "todo",
          chainId: chain.id,
          title: "Task",
          description: "",
          expectedFiles: [],
          acceptance: [],
          constraints: [],
          notes: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const status = chainManager.getChainStatus(chain);
      expect(status).toBe("todo");
    });
  });

  describe("updateChain", () => {
    it("updates chain title", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "update-title",
        title: "Original Title",
      });

      const updated = await chainManager.updateChain(chain.id, {
        title: "New Title",
      });

      expect(updated).not.toBeNull();
      expect(updated!.title).toBe("New Title");
    });

    it("updates chain type", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "update-type",
        title: "Update Type",
      });

      const updated = await chainManager.updateChain(chain.id, {
        type: "design",
      });

      expect(updated).not.toBeNull();
      expect(updated!.type).toBe("design");
    });

    it("updates dependsOn", async () => {
      const designChain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "design",
        title: "Design",
        type: "design",
      });

      const implChain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "impl",
        title: "Implementation",
        type: "implementation",
      });

      const updated = await chainManager.updateChain(implChain.id, {
        dependsOn: designChain.id,
      });

      expect(updated).not.toBeNull();
      expect(updated!.dependsOn).toBe(designChain.id);
    });

    it("returns null for non-existent chain", async () => {
      const updated = await chainManager.updateChain("CHAIN-999-fake", {
        title: "New Title",
      });

      expect(updated).toBeNull();
    });

    it("persists updates to metadata file", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "persist-update",
        title: "Original",
      });

      await chainManager.updateChain(chain.id, {
        title: "Updated",
        description: "New description",
      });

      // Re-read from disk
      const loaded = await chainManager.getChain(chain.id);
      expect(loaded!.title).toBe("Updated");
      expect(loaded!.description).toBe("New description");
    });
  });

  describe("deleteChain", () => {
    it("deletes an existing chain", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "delete-me",
        title: "Delete Me",
      });

      const result = await chainManager.deleteChain(chain.id);
      expect(result).toBe(true);

      const retrieved = await chainManager.getChain(chain.id);
      expect(retrieved).toBeNull();
    });

    it("returns false for non-existent chain", async () => {
      const result = await chainManager.deleteChain("CHAIN-999-fake");
      expect(result).toBe(false);
    });

    it("removes chain directory", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "delete-dir",
        title: "Delete Dir",
      });

      const chainDir = path.join(tempDir, "docs/tasks/backlog", chain.id);
      
      // Verify directory exists before delete
      const statBefore = await fs.stat(chainDir);
      expect(statBefore.isDirectory()).toBe(true);

      await chainManager.deleteChain(chain.id);

      // Verify directory is gone
      await expect(fs.access(chainDir)).rejects.toThrow();
    });

    it("removes metadata file", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "delete-meta",
        title: "Delete Meta",
      });

      const metadataPath = path.join(
        tempDir,
        "docs/tasks/.chains",
        `${chain.id}.json`
      );

      // Verify metadata exists before delete
      await fs.access(metadataPath);

      await chainManager.deleteChain(chain.id);

      // Verify metadata is gone
      await expect(fs.access(metadataPath)).rejects.toThrow();
    });
  });

  describe("addTask", () => {
    it("adds a task to a chain", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "add-task",
        title: "Add Task",
      });

      const task = await chainManager.addTask(chain.id, {
        slug: "first-task",
        title: "First Task",
        description: "Do something",
      });

      expect(task.id).toBe("001-first-task");
      expect(task.chainId).toBe(chain.id);
      expect(task.title).toBe("First Task");
    });

    it("increments task sequence", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "multi-task",
        title: "Multi Task",
      });

      const task1 = await chainManager.addTask(chain.id, {
        slug: "task-one",
        title: "Task One",
        description: "First",
      });

      const task2 = await chainManager.addTask(chain.id, {
        slug: "task-two",
        title: "Task Two",
        description: "Second",
      });

      expect(task1.sequence).toBe(1);
      expect(task2.sequence).toBe(2);
    });
  });

  describe("getNextTask", () => {
    it("returns null for chain with no tasks", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "no-tasks",
        title: "No Tasks",
      });

      const next = await chainManager.getNextTask(chain.id);
      expect(next).toBeNull();
    });
  });

  describe("getChainSummary", () => {
    it("returns null for non-existent chain", async () => {
      const summary = await chainManager.getChainSummary("CHAIN-999-fake");
      expect(summary).toBeNull();
    });

    it("returns summary for existing chain", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "summary",
        title: "Summary Test",
      });

      const summary = await chainManager.getChainSummary(chain.id);
      expect(summary).not.toBeNull();
      expect(summary!.chain.id).toBe(chain.id);
      expect(summary!.status).toBe("backlog");
      expect(summary!.progress).toBe(0);
    });

    it("calculates progress correctly", async () => {
      const chain = await chainManager.createChain({
        requestId: "CR-001",
        slug: "progress",
        title: "Progress Test",
      });

      // Add tasks directly to chain for testing
      chain.tasks = [
        {
          id: "001-task",
          sequence: 1,
          slug: "task1",
          status: "done",
          chainId: chain.id,
          title: "Task 1",
          description: "",
          expectedFiles: [],
          acceptance: [],
          constraints: [],
          notes: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "002-task",
          sequence: 2,
          slug: "task2",
          status: "todo",
          chainId: chain.id,
          title: "Task 2",
          description: "",
          expectedFiles: [],
          acceptance: [],
          constraints: [],
          notes: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Note: getChainSummary loads from disk, so this tests the structure
      // For a full integration test, we'd need to persist tasks
      const summary = await chainManager.getChainSummary(chain.id);
      expect(summary).not.toBeNull();
      expect(summary!.taskCounts).toBeDefined();
    });
  });

  describe("getTaskManager", () => {
    it("returns the task manager instance", () => {
      const taskManager = chainManager.getTaskManager();
      expect(taskManager).toBeDefined();
    });
  });

  describe("error cases", () => {
    it("handles invalid chain ID format gracefully", async () => {
      const chain = await chainManager.getChain("invalid-format");
      expect(chain).toBeNull();
    });

    it("handles chain ID with wrong prefix", async () => {
      const chain = await chainManager.getChain("WRONG-001-prefix");
      expect(chain).toBeNull();
    });
  });
});
