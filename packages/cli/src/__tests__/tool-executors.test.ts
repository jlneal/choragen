/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Verify tool executors correctly execute tools and return structured results"
 * @test-type unit
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import {
  ToolExecutor,
  defaultExecutor,
  executeChainStatus,
  executeTaskStatus,
  executeTaskList,
  executeTaskStart,
  executeTaskComplete,
  executeTaskApprove,
  executeSpawnImplSession,
} from "../runtime/tools/index.js";
import type { ExecutionContext } from "../runtime/tools/index.js";

describe("ToolExecutor", () => {
  describe("execute", () => {
    it("returns error for unknown tool", async () => {
      const executor = new ToolExecutor();
      const context: ExecutionContext = {
        role: "control",
        workspaceRoot: "/tmp",
      };

      const result = await executor.execute("unknown:tool", {}, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown tool: unknown:tool");
    });

    it("dispatches to correct executor", async () => {
      const executor = new ToolExecutor();
      const context: ExecutionContext = {
        role: "control",
        workspaceRoot: "/tmp",
      };

      // spawn_impl_session always returns a stub error, so we can test dispatch
      const result = await executor.execute(
        "spawn_impl_session",
        { chainId: "CHAIN-001-test", taskId: "001-test" },
        context
      );

      expect(result.error).toContain("Phase 2");
    });

    it("catches and wraps executor errors", async () => {
      const executor = new ToolExecutor();
      executor.registerExecutor("error:tool", async () => {
        throw new Error("Test error");
      });

      const context: ExecutionContext = {
        role: "control",
        workspaceRoot: "/tmp",
      };

      const result = await executor.execute("error:tool", {}, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Tool execution failed");
      expect(result.error).toContain("Test error");
    });
  });

  describe("hasExecutor", () => {
    it("returns true for registered tools", () => {
      const executor = new ToolExecutor();
      expect(executor.hasExecutor("chain:status")).toBe(true);
      expect(executor.hasExecutor("task:start")).toBe(true);
    });

    it("returns false for unregistered tools", () => {
      const executor = new ToolExecutor();
      expect(executor.hasExecutor("unknown:tool")).toBe(false);
    });
  });

  describe("registerExecutor", () => {
    it("adds a new executor", async () => {
      const executor = new ToolExecutor();
      executor.registerExecutor("custom:tool", async () => ({
        success: true,
        data: { custom: true },
      }));

      expect(executor.hasExecutor("custom:tool")).toBe(true);

      const result = await executor.execute(
        "custom:tool",
        {},
        { role: "control", workspaceRoot: "/tmp" }
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ custom: true });
    });
  });

  describe("getRegisteredTools", () => {
    it("returns all registered tool names", () => {
      const executor = new ToolExecutor();
      const tools = executor.getRegisteredTools();

      expect(tools).toContain("chain:status");
      expect(tools).toContain("task:status");
      expect(tools).toContain("task:list");
      expect(tools).toContain("task:start");
      expect(tools).toContain("task:complete");
      expect(tools).toContain("task:approve");
      expect(tools).toContain("spawn_impl_session");
    });
  });
});

describe("defaultExecutor", () => {
  it("is a ToolExecutor instance", () => {
    expect(defaultExecutor).toBeInstanceOf(ToolExecutor);
  });

  it("has all Phase 1 executors", () => {
    const tools = defaultExecutor.getRegisteredTools();
    const EXPECTED_EXECUTOR_COUNT = 7;
    expect(tools).toHaveLength(EXPECTED_EXECUTOR_COUNT);
  });
});

describe("Individual executors", () => {
  let tempDir: string;
  let context: ExecutionContext;

  beforeEach(async () => {
    // Create a temporary directory for tests
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-test-"));
    context = {
      role: "control",
      workspaceRoot: tempDir,
    };

    // Create docs/tasks directory structure
    await fs.mkdir(path.join(tempDir, "docs/tasks/.chains"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "docs/tasks/todo"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "docs/tasks/in-progress"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "docs/tasks/in-review"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "docs/tasks/done"), { recursive: true });
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("executeChainStatus", () => {
    it("returns error for missing chainId", async () => {
      const result = await executeChainStatus({}, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing required parameter: chainId");
    });

    it("returns error for non-existent chain", async () => {
      const result = await executeChainStatus(
        { chainId: "CHAIN-999-nonexistent" },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Chain not found");
    });

    it("returns chain status for existing chain", async () => {
      // Create chain metadata
      const chainId = "CHAIN-001-test";
      await fs.writeFile(
        path.join(tempDir, "docs/tasks/.chains", `${chainId}.json`),
        JSON.stringify({
          id: chainId,
          sequence: 1,
          slug: "test",
          requestId: "CR-20251208-001",
          title: "Test Chain",
          description: "A test chain",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      );

      const result = await executeChainStatus({ chainId }, context);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        chainId,
        title: "Test Chain",
        requestId: "CR-20251208-001",
      });
    });
  });

  describe("executeTaskStatus", () => {
    it("returns error for missing chainId", async () => {
      const result = await executeTaskStatus({ taskId: "001-test" }, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing required parameter: chainId");
    });

    it("returns error for missing taskId", async () => {
      const result = await executeTaskStatus(
        { chainId: "CHAIN-001-test" },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing required parameter: taskId");
    });

    it("returns error for non-existent task", async () => {
      const result = await executeTaskStatus(
        { chainId: "CHAIN-001-test", taskId: "999-nonexistent" },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Task not found");
    });
  });

  describe("executeTaskList", () => {
    it("returns error for missing chainId", async () => {
      const result = await executeTaskList({}, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing required parameter: chainId");
    });

    it("returns empty list for chain with no tasks", async () => {
      const result = await executeTaskList(
        { chainId: "CHAIN-001-test" },
        context
      );

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        chainId: "CHAIN-001-test",
        tasks: [],
        count: 0,
      });
    });
  });

  describe("executeTaskStart", () => {
    it("returns error for missing chainId", async () => {
      const result = await executeTaskStart({ taskId: "001-test" }, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing required parameter: chainId");
    });

    it("returns error for missing taskId", async () => {
      const result = await executeTaskStart(
        { chainId: "CHAIN-001-test" },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing required parameter: taskId");
    });

    it("returns error for non-existent task", async () => {
      const result = await executeTaskStart(
        { chainId: "CHAIN-001-test", taskId: "999-nonexistent" },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  describe("executeTaskComplete", () => {
    it("returns error for missing chainId", async () => {
      const result = await executeTaskComplete({ taskId: "001-test" }, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing required parameter: chainId");
    });

    it("returns error for missing taskId", async () => {
      const result = await executeTaskComplete(
        { chainId: "CHAIN-001-test" },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing required parameter: taskId");
    });

    it("returns error for non-existent task", async () => {
      const result = await executeTaskComplete(
        { chainId: "CHAIN-001-test", taskId: "999-nonexistent" },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  describe("executeTaskApprove", () => {
    it("returns error for missing chainId", async () => {
      const result = await executeTaskApprove({ taskId: "001-test" }, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing required parameter: chainId");
    });

    it("returns error for missing taskId", async () => {
      const result = await executeTaskApprove(
        { chainId: "CHAIN-001-test" },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing required parameter: taskId");
    });

    it("returns error for non-existent task", async () => {
      const result = await executeTaskApprove(
        { chainId: "CHAIN-001-test", taskId: "999-nonexistent" },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  describe("executeSpawnImplSession", () => {
    it("returns error for missing chainId", async () => {
      const result = await executeSpawnImplSession(
        { taskId: "001-test" },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing required parameter: chainId");
    });

    it("returns error for missing taskId", async () => {
      const result = await executeSpawnImplSession(
        { chainId: "CHAIN-001-test" },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing required parameter: taskId");
    });

    it("returns Phase 2 stub message", async () => {
      const result = await executeSpawnImplSession(
        { chainId: "CHAIN-001-test", taskId: "001-test" },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Nested sessions not yet implemented (Phase 2)");
      expect(result.data).toMatchObject({
        chainId: "CHAIN-001-test",
        taskId: "001-test",
        message: expect.stringContaining("Phase 2"),
      });
    });

    it("includes context in stub response", async () => {
      const result = await executeSpawnImplSession(
        {
          chainId: "CHAIN-001-test",
          taskId: "001-test",
          context: "Additional instructions",
        },
        context
      );

      expect(result.data).toMatchObject({
        context: "Additional instructions",
      });
    });
  });
});
