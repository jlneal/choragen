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
  executeReadFile,
  executeWriteFile,
  executeListFiles,
  executeSearchFiles,
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
      expect(tools).toContain("read_file");
      expect(tools).toContain("write_file");
      expect(tools).toContain("list_files");
      expect(tools).toContain("search_files");
    });
  });
});

describe("defaultExecutor", () => {
  it("is a ToolExecutor instance", () => {
    expect(defaultExecutor).toBeInstanceOf(ToolExecutor);
  });

  it("has all Phase 1 executors", () => {
    const tools = defaultExecutor.getRegisteredTools();
    const EXPECTED_EXECUTOR_COUNT = 11;
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

  describe("executeReadFile", () => {
    it("returns error for missing path", async () => {
      const result = await executeReadFile({}, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing required parameter: path");
    });

    it("returns error for non-existent file", async () => {
      const result = await executeReadFile(
        { path: "nonexistent-file.txt" },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("File not found");
    });

    it("reads file with line numbers", async () => {
      // Create a test file
      const testContent = "line 1\nline 2\nline 3";
      await fs.writeFile(path.join(tempDir, "test.txt"), testContent);

      const result = await executeReadFile({ path: "test.txt" }, context);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        path: "test.txt",
        totalLines: 3,
        startLine: 1,
        endLine: 3,
        linesReturned: 3,
      });
      // Check line number format
      const content = (result.data as { content: string }).content;
      expect(content).toContain("     1→line 1");
      expect(content).toContain("     2→line 2");
      expect(content).toContain("     3→line 3");
    });

    it("respects offset parameter", async () => {
      const testContent = "line 1\nline 2\nline 3\nline 4\nline 5";
      await fs.writeFile(path.join(tempDir, "test.txt"), testContent);

      const result = await executeReadFile(
        { path: "test.txt", offset: 3 },
        context
      );

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        startLine: 3,
        endLine: 5,
        linesReturned: 3,
      });
      const content = (result.data as { content: string }).content;
      expect(content).toContain("     3→line 3");
      expect(content).not.toContain("line 1");
    });

    it("respects limit parameter", async () => {
      const testContent = "line 1\nline 2\nline 3\nline 4\nline 5";
      await fs.writeFile(path.join(tempDir, "test.txt"), testContent);

      const result = await executeReadFile(
        { path: "test.txt", limit: 2 },
        context
      );

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        startLine: 1,
        endLine: 2,
        linesReturned: 2,
      });
    });

    it("respects both offset and limit", async () => {
      const testContent = "line 1\nline 2\nline 3\nline 4\nline 5";
      await fs.writeFile(path.join(tempDir, "test.txt"), testContent);

      const result = await executeReadFile(
        { path: "test.txt", offset: 2, limit: 2 },
        context
      );

      expect(result.success).toBe(true);
      // offset=2 starts at line 2, limit=2 returns lines 2 and 3
      expect(result.data).toMatchObject({
        startLine: 2,
        endLine: 3,
        linesReturned: 2,
      });
      const content = (result.data as { content: string }).content;
      expect(content).toContain("     2→line 2");
      expect(content).toContain("     3→line 3");
    });

    it("returns error for directory path", async () => {
      await fs.mkdir(path.join(tempDir, "testdir"), { recursive: true });

      const result = await executeReadFile({ path: "testdir" }, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Path is not a file");
    });

    it("handles absolute paths", async () => {
      const testContent = "absolute path content";
      const absolutePath = path.join(tempDir, "absolute-test.txt");
      await fs.writeFile(absolutePath, testContent);

      const result = await executeReadFile({ path: absolutePath }, context);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        path: absolutePath,
        linesReturned: 1,
      });
    });

    it("rejects binary files", async () => {
      // Create a file with null bytes (binary indicator)
      const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      await fs.writeFile(path.join(tempDir, "binary.bin"), binaryContent);

      const result = await executeReadFile({ path: "binary.bin" }, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot read binary file");
    });

    it("handles empty files", async () => {
      await fs.writeFile(path.join(tempDir, "empty.txt"), "");

      const result = await executeReadFile({ path: "empty.txt" }, context);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        totalLines: 1,
        linesReturned: 1,
      });
    });
  });

  describe("executeWriteFile", () => {
    it("returns error for missing path", async () => {
      const result = await executeWriteFile({ content: "test" }, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing required parameter: path");
    });

    it("returns error for missing content", async () => {
      const result = await executeWriteFile({ path: "test.txt" }, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing required parameter: content");
    });

    it("creates a new file", async () => {
      const result = await executeWriteFile(
        { path: "new-file.txt", content: "Hello, World!" },
        context
      );

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        path: "new-file.txt",
        action: "created",
      });

      // Verify file was created
      const content = await fs.readFile(path.join(tempDir, "new-file.txt"), "utf-8");
      expect(content).toBe("Hello, World!");
    });

    it("modifies an existing file", async () => {
      // Create initial file
      await fs.writeFile(path.join(tempDir, "existing.txt"), "old content");

      const result = await executeWriteFile(
        { path: "existing.txt", content: "new content" },
        context
      );

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        path: "existing.txt",
        action: "modified",
      });

      // Verify content was updated
      const content = await fs.readFile(path.join(tempDir, "existing.txt"), "utf-8");
      expect(content).toBe("new content");
    });

    it("fails with createOnly when file exists", async () => {
      // Create initial file
      await fs.writeFile(path.join(tempDir, "exists.txt"), "content");

      const result = await executeWriteFile(
        { path: "exists.txt", content: "new content", createOnly: true },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("File already exists");
    });

    it("succeeds with createOnly when file does not exist", async () => {
      const result = await executeWriteFile(
        { path: "brand-new.txt", content: "content", createOnly: true },
        context
      );

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        action: "created",
      });
    });

    it("creates parent directories if needed", async () => {
      const result = await executeWriteFile(
        { path: "nested/deep/file.txt", content: "nested content" },
        context
      );

      expect(result.success).toBe(true);

      // Verify file was created in nested directory
      const content = await fs.readFile(
        path.join(tempDir, "nested/deep/file.txt"),
        "utf-8"
      );
      expect(content).toBe("nested content");
    });

    it("returns error when path is a directory", async () => {
      await fs.mkdir(path.join(tempDir, "a-directory"), { recursive: true });

      const result = await executeWriteFile(
        { path: "a-directory", content: "content" },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Path is a directory");
    });
  });

  describe("executeListFiles", () => {
    it("returns error for missing path", async () => {
      const result = await executeListFiles({}, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing required parameter: path");
    });

    it("returns error for non-existent directory", async () => {
      const result = await executeListFiles(
        { path: "nonexistent-dir" },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Directory not found");
    });

    it("returns error when path is a file", async () => {
      await fs.writeFile(path.join(tempDir, "a-file.txt"), "content");

      const result = await executeListFiles({ path: "a-file.txt" }, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Path is not a directory");
    });

    it("lists directory contents", async () => {
      // Create test structure
      await fs.writeFile(path.join(tempDir, "file1.txt"), "content1");
      await fs.writeFile(path.join(tempDir, "file2.ts"), "content2");
      await fs.mkdir(path.join(tempDir, "subdir"), { recursive: true });

      const result = await executeListFiles({ path: "." }, context);

      expect(result.success).toBe(true);
      const data = result.data as { entries: Array<{ name: string; type: string }> };
      const names = data.entries.map((e) => e.name);

      expect(names).toContain("file1.txt");
      expect(names).toContain("file2.ts");
      expect(names).toContain("subdir/");
    });

    it("filters by pattern", async () => {
      // Create test files
      await fs.writeFile(path.join(tempDir, "test1.ts"), "ts content");
      await fs.writeFile(path.join(tempDir, "test2.ts"), "ts content");
      await fs.writeFile(path.join(tempDir, "test.md"), "md content");

      const result = await executeListFiles(
        { path: ".", pattern: "*.ts" },
        context
      );

      expect(result.success).toBe(true);
      const data = result.data as { entries: Array<{ name: string }> };
      const names = data.entries.map((e) => e.name);

      expect(names).toContain("test1.ts");
      expect(names).toContain("test2.ts");
      expect(names).not.toContain("test.md");
    });

    it("lists recursively when requested", async () => {
      // Create nested structure
      await fs.mkdir(path.join(tempDir, "level1/level2"), { recursive: true });
      await fs.writeFile(path.join(tempDir, "root.txt"), "root");
      await fs.writeFile(path.join(tempDir, "level1/mid.txt"), "mid");
      await fs.writeFile(path.join(tempDir, "level1/level2/deep.txt"), "deep");

      const result = await executeListFiles(
        { path: ".", recursive: true },
        context
      );

      expect(result.success).toBe(true);
      const data = result.data as { entries: Array<{ name: string }> };
      const names = data.entries.map((e) => e.name);

      expect(names).toContain("root.txt");
      expect(names.some((n) => n.includes("mid.txt"))).toBe(true);
      expect(names.some((n) => n.includes("deep.txt"))).toBe(true);
    });
  });

  describe("executeSearchFiles", () => {
    it("returns error for missing query", async () => {
      const result = await executeSearchFiles({}, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing required parameter: query");
    });

    it("returns error for invalid regex", async () => {
      const result = await executeSearchFiles({ query: "[invalid" }, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid regex pattern");
    });

    it("returns error for non-existent directory", async () => {
      const result = await executeSearchFiles(
        { query: "test", path: "nonexistent" },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Directory not found");
    });

    it("finds matches in files", async () => {
      // Create test files
      await fs.writeFile(
        path.join(tempDir, "search-test.txt"),
        "line 1\nfind this line\nline 3"
      );

      const result = await executeSearchFiles(
        { query: "find this" },
        context
      );

      expect(result.success).toBe(true);
      const data = result.data as {
        matches: Array<{ file: string; line: number; content: string }>;
      };

      expect(data.matches.length).toBeGreaterThan(0);
      expect(data.matches[0].content).toContain("find this");
      const EXPECTED_LINE_NUMBER = 2;
      expect(data.matches[0].line).toBe(EXPECTED_LINE_NUMBER);
    });

    it("supports regex patterns", async () => {
      await fs.writeFile(
        path.join(tempDir, "regex-test.txt"),
        "export function foo() {}\nexport const bar = 1;"
      );

      const result = await executeSearchFiles(
        { query: "export (function|const)" },
        context
      );

      expect(result.success).toBe(true);
      const data = result.data as { matches: Array<{ content: string }> };
      const EXPECTED_MATCH_COUNT = 2;
      expect(data.matches.length).toBe(EXPECTED_MATCH_COUNT);
    });

    it("filters by include pattern", async () => {
      await fs.writeFile(path.join(tempDir, "include-test.ts"), "findme");
      await fs.writeFile(path.join(tempDir, "include-test.md"), "findme");

      const result = await executeSearchFiles(
        { query: "findme", include: "*.ts" },
        context
      );

      expect(result.success).toBe(true);
      const data = result.data as { matches: Array<{ file: string }> };

      expect(data.matches.length).toBe(1);
      expect(data.matches[0].file).toContain(".ts");
    });

    it("skips binary files", async () => {
      // Create a binary file with null bytes
      const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      await fs.writeFile(path.join(tempDir, "binary-search.bin"), binaryContent);

      // Create a text file with searchable content
      await fs.writeFile(path.join(tempDir, "text-search.txt"), "searchable");

      const result = await executeSearchFiles(
        { query: "searchable" },
        context
      );

      expect(result.success).toBe(true);
      const data = result.data as { matches: Array<{ file: string }> };

      // Should only find the text file, not the binary
      expect(data.matches.length).toBe(1);
      expect(data.matches[0].file).toContain("text-search.txt");
    });

    it("returns truncated flag when max matches exceeded", async () => {
      // Create a subdirectory with only our test file to avoid other matches
      const searchDir = path.join(tempDir, "truncate-test");
      await fs.mkdir(searchDir, { recursive: true });
      
      // Create a file with many matching lines (more than MAX_MATCHES=100)
      const LINES_TO_CREATE = 200;
      const manyLines = Array.from({ length: LINES_TO_CREATE }, (_, i) => `unique_truncate_match_${i}`).join("\n");
      await fs.writeFile(path.join(searchDir, "many-matches.txt"), manyLines);

      const result = await executeSearchFiles(
        { query: "unique_truncate_match", path: "truncate-test" },
        context
      );

      expect(result.success).toBe(true);
      const data = result.data as { totalMatches: number; truncated: boolean };

      const MAX_MATCHES = 100;
      expect(data.totalMatches).toBe(MAX_MATCHES);
      expect(data.truncated).toBe(true);
    });
  });
});
