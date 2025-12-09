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
import type { ExecutionContext, NestedSessionContext, ChildSessionResult } from "../runtime/tools/index.js";

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

      // spawn_impl_session returns error when called without nested session context
      const result = await executor.execute(
        "spawn_impl_session",
        { chainId: "CHAIN-001-test", taskId: "001-test" },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Nested session context not available");
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

    it("returns error when nested session context not available", async () => {
      const result = await executeSpawnImplSession(
        { chainId: "CHAIN-001-test", taskId: "001-test" },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Nested session context not available. This tool requires the extended execution context.");
      expect(result.data).toMatchObject({
        chainId: "CHAIN-001-test",
        taskId: "001-test",
        hint: expect.stringContaining("nested session support"),
      });
    });

    it("returns error when max nesting depth exceeded", async () => {
      const nestedContext: NestedSessionContext = {
        ...context,
        sessionId: "session-001",
        nestingDepth: 2,
        maxNestingDepth: 2,
      };

      const result = await executeSpawnImplSession(
        { chainId: "CHAIN-001-test", taskId: "001-test" },
        nestedContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Maximum nesting depth");
      expect(result.data).toMatchObject({
        currentDepth: 2,
        maxDepth: 2,
      });
    });

    it("returns error when spawnChildSession not configured", async () => {
      const nestedContext: NestedSessionContext = {
        ...context,
        sessionId: "session-001",
        nestingDepth: 0,
        maxNestingDepth: 2,
        // spawnChildSession not provided
      };

      const result = await executeSpawnImplSession(
        { chainId: "CHAIN-001-test", taskId: "001-test" },
        nestedContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Child session spawning not configured");
    });

    it("spawns child session successfully when properly configured", async () => {
      const mockChildResult: ChildSessionResult = {
        success: true,
        sessionId: "child-session-001",
        iterations: 3,
        tokensUsed: { input: 100, output: 50 },
        summary: "Impl session completed in 3 iterations",
      };

      const nestedContext: NestedSessionContext = {
        ...context,
        sessionId: "session-001",
        nestingDepth: 0,
        maxNestingDepth: 2,
        spawnChildSession: async () => mockChildResult,
      };

      const result = await executeSpawnImplSession(
        {
          chainId: "CHAIN-001-test",
          taskId: "001-test",
          context: "Additional instructions",
        },
        nestedContext
      );

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        message: "Impl session completed successfully",
        childSessionId: "child-session-001",
        iterations: 3,
      });
    });

    it("handles child session failure", async () => {
      const mockChildResult: ChildSessionResult = {
        success: false,
        sessionId: "child-session-001",
        iterations: 1,
        tokensUsed: { input: 50, output: 20 },
        error: "Task file not found",
      };

      const nestedContext: NestedSessionContext = {
        ...context,
        sessionId: "session-001",
        nestingDepth: 0,
        maxNestingDepth: 2,
        spawnChildSession: async () => mockChildResult,
      };

      const result = await executeSpawnImplSession(
        { chainId: "CHAIN-001-test", taskId: "001-test" },
        nestedContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Task file not found");
      expect(result.data).toMatchObject({
        childSessionId: "child-session-001",
      });
    });
  });
});
