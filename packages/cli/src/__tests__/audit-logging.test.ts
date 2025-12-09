/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Verify audit logging for file operations"
 * @test-type unit
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { AuditLogger, type AuditLogEntry } from "../runtime/session.js";
import {
  ToolExecutor,
  buildDeniedAuditEntry,
  type ExecutionContext,
  type ToolExecutorFn,
} from "../runtime/tools/executor.js";

// Test constants for byte sizes (not HTTP status codes)
const EXPECTED_BYTES_SMALL = 500;
const EXPECTED_BYTES_MEDIUM = 750;

describe("AuditLogger", () => {
  let testWorkspace: string;

  beforeEach(async () => {
    testWorkspace = join(tmpdir(), `choragen-audit-test-${Date.now()}`);
    await mkdir(testWorkspace, { recursive: true });
  });

  afterEach(async () => {
    await rm(testWorkspace, { recursive: true, force: true });
  });

  describe("constructor", () => {
    it("creates logger with correct file path", () => {
      const logger = new AuditLogger("session-001", testWorkspace);
      const filePath = logger.getFilePath();

      expect(filePath).toBe(
        join(testWorkspace, ".choragen/metrics/audit-session-001.jsonl")
      );
    });
  });

  describe("shouldLog", () => {
    it("returns true for read_file", () => {
      expect(AuditLogger.shouldLog("read_file")).toBe(true);
    });

    it("returns true for write_file", () => {
      expect(AuditLogger.shouldLog("write_file")).toBe(true);
    });

    it("returns true for list_files", () => {
      expect(AuditLogger.shouldLog("list_files")).toBe(true);
    });

    it("returns true for search_files", () => {
      expect(AuditLogger.shouldLog("search_files")).toBe(true);
    });

    it("returns false for non-file tools", () => {
      expect(AuditLogger.shouldLog("chain:status")).toBe(false);
      expect(AuditLogger.shouldLog("task:start")).toBe(false);
      expect(AuditLogger.shouldLog("spawn_impl_session")).toBe(false);
    });
  });

  describe("log", () => {
    it("creates metrics directory if it does not exist", async () => {
      const logger = new AuditLogger("session-001", testWorkspace);

      await logger.log({
        tool: "read_file",
        path: "test.ts",
        result: "success",
        governance: "pass",
      });

      const content = await readFile(logger.getFilePath(), "utf-8");
      expect(content).toBeTruthy();
    });

    it("writes JSONL format with one entry per line", async () => {
      const logger = new AuditLogger("session-001", testWorkspace);

      await logger.log({
        tool: "read_file",
        path: "file1.ts",
        result: "success",
        governance: "pass",
      });

      await logger.log({
        tool: "write_file",
        path: "file2.ts",
        result: "success",
        action: "create",
        bytes: 100,
        governance: "pass",
      });

      const content = await readFile(logger.getFilePath(), "utf-8");
      const lines = content.trim().split("\n");

      expect(lines).toHaveLength(2);
      // Each line should be valid JSON
      const entry1 = JSON.parse(lines[0]) as AuditLogEntry;
      const entry2 = JSON.parse(lines[1]) as AuditLogEntry;

      expect(entry1.tool).toBe("read_file");
      expect(entry2.tool).toBe("write_file");
    });

    it("auto-fills timestamp and session", async () => {
      const logger = new AuditLogger("session-test-123", testWorkspace);
      const before = new Date().toISOString();

      await logger.log({
        tool: "read_file",
        path: "test.ts",
        result: "success",
        governance: "pass",
      });

      const after = new Date().toISOString();
      const content = await readFile(logger.getFilePath(), "utf-8");
      const entry = JSON.parse(content.trim()) as AuditLogEntry;

      expect(entry.session).toBe("session-test-123");
      expect(entry.timestamp >= before).toBe(true);
      expect(entry.timestamp <= after).toBe(true);
    });

    it("logs read_file with lines count", async () => {
      const logger = new AuditLogger("session-001", testWorkspace);

      await logger.log({
        tool: "read_file",
        path: "packages/core/src/foo.ts",
        result: "success",
        lines: 42,
        governance: "pass",
      });

      const content = await readFile(logger.getFilePath(), "utf-8");
      const entry = JSON.parse(content.trim()) as AuditLogEntry;

      expect(entry.tool).toBe("read_file");
      expect(entry.path).toBe("packages/core/src/foo.ts");
      expect(entry.result).toBe("success");
      expect(entry.lines).toBe(42);
      expect(entry.governance).toBe("pass");
    });

    it("logs write_file with action and bytes", async () => {
      const logger = new AuditLogger("session-001", testWorkspace);

      await logger.log({
        tool: "write_file",
        path: "packages/core/src/foo.ts",
        result: "success",
        action: "create",
        bytes: 1234,
        governance: "pass",
      });

      const content = await readFile(logger.getFilePath(), "utf-8");
      const entry = JSON.parse(content.trim()) as AuditLogEntry;

      expect(entry.tool).toBe("write_file");
      expect(entry.action).toBe("create");
      expect(entry.bytes).toBe(1234);
    });

    it("logs denied operations with reason", async () => {
      const logger = new AuditLogger("session-001", testWorkspace);

      await logger.log({
        tool: "write_file",
        path: "docs/adr/todo/ADR-008.md",
        result: "denied",
        governance: "deny",
        reason: "impl cannot modify docs/**",
      });

      const content = await readFile(logger.getFilePath(), "utf-8");
      const entry = JSON.parse(content.trim()) as AuditLogEntry;

      expect(entry.result).toBe("denied");
      expect(entry.governance).toBe("deny");
      expect(entry.reason).toBe("impl cannot modify docs/**");
    });

    it("logs list_files with count", async () => {
      const logger = new AuditLogger("session-001", testWorkspace);

      await logger.log({
        tool: "list_files",
        path: "packages/core/src",
        result: "success",
        count: 15,
        governance: "pass",
      });

      const content = await readFile(logger.getFilePath(), "utf-8");
      const entry = JSON.parse(content.trim()) as AuditLogEntry;

      expect(entry.tool).toBe("list_files");
      expect(entry.count).toBe(15);
    });

    it("logs search_files with matches", async () => {
      const logger = new AuditLogger("session-001", testWorkspace);

      await logger.log({
        tool: "search_files",
        path: "packages/core",
        result: "success",
        matches: 23,
        governance: "pass",
      });

      const content = await readFile(logger.getFilePath(), "utf-8");
      const entry = JSON.parse(content.trim()) as AuditLogEntry;

      expect(entry.tool).toBe("search_files");
      expect(entry.matches).toBe(23);
    });
  });
});

describe("buildDeniedAuditEntry", () => {
  it("builds entry for denied file operation", () => {
    const entry = buildDeniedAuditEntry(
      "write_file",
      { path: "docs/adr/todo/ADR-008.md", content: "test" },
      "impl cannot modify docs/**"
    );

    expect(entry.tool).toBe("write_file");
    expect(entry.path).toBe("docs/adr/todo/ADR-008.md");
    expect(entry.result).toBe("denied");
    expect(entry.governance).toBe("deny");
    expect(entry.reason).toBe("impl cannot modify docs/**");
  });

  it("handles missing path parameter", () => {
    const entry = buildDeniedAuditEntry(
      "search_files",
      { query: "test" },
      "operation not allowed"
    );

    expect(entry.tool).toBe("search_files");
    expect(entry.path).toBeUndefined();
    expect(entry.result).toBe("denied");
  });
});

describe("ToolExecutor audit logging integration", () => {
  let testWorkspace: string;
  let auditEntries: Omit<AuditLogEntry, "timestamp" | "session">[];

  beforeEach(async () => {
    testWorkspace = join(tmpdir(), `choragen-executor-audit-test-${Date.now()}`);
    await mkdir(testWorkspace, { recursive: true });
    auditEntries = [];
  });

  afterEach(async () => {
    await rm(testWorkspace, { recursive: true, force: true });
  });

  it("calls auditLog callback for file operations", async () => {
    const mockReadFile: ToolExecutorFn = async () => ({
      success: true,
      data: {
        path: "test.ts",
        content: "line 1\nline 2",
        totalLines: 2,
        startLine: 1,
        endLine: 2,
        linesReturned: 2,
      },
    });

    const executor = new ToolExecutor(new Map([["read_file", mockReadFile]]));

    const context: ExecutionContext = {
      role: "impl",
      workspaceRoot: testWorkspace,
      auditLog: async (entry) => {
        auditEntries.push(entry);
      },
    };

    await executor.execute("read_file", { path: "test.ts" }, context);

    expect(auditEntries).toHaveLength(1);
    expect(auditEntries[0].tool).toBe("read_file");
    expect(auditEntries[0].path).toBe("test.ts");
    expect(auditEntries[0].result).toBe("success");
    expect(auditEntries[0].lines).toBe(2);
    expect(auditEntries[0].governance).toBe("pass");
  });

  it("does not call auditLog for non-file tools", async () => {
    const mockChainStatus: ToolExecutorFn = async () => ({
      success: true,
      data: { status: "active" },
    });

    const executor = new ToolExecutor(
      new Map([["chain:status", mockChainStatus]])
    );

    const context: ExecutionContext = {
      role: "control",
      workspaceRoot: testWorkspace,
      auditLog: async (entry) => {
        auditEntries.push(entry);
      },
    };

    await executor.execute("chain:status", { chainId: "CHAIN-001" }, context);

    expect(auditEntries).toHaveLength(0);
  });

  it("logs write_file with action and bytes", async () => {
    const mockWriteFile: ToolExecutorFn = async () => ({
      success: true,
      data: {
        path: "new-file.ts",
        action: "created", // Matches executeWriteFile return value
        bytes: EXPECTED_BYTES_SMALL,
      },
    });

    const executor = new ToolExecutor(new Map([["write_file", mockWriteFile]]));

    const context: ExecutionContext = {
      role: "impl",
      workspaceRoot: testWorkspace,
      auditLog: async (entry) => {
        auditEntries.push(entry);
      },
    };

    await executor.execute(
      "write_file",
      { path: "new-file.ts", content: "test content" },
      context
    );

    expect(auditEntries).toHaveLength(1);
    expect(auditEntries[0].tool).toBe("write_file");
    expect(auditEntries[0].action).toBe("create");
    expect(auditEntries[0].bytes).toBe(EXPECTED_BYTES_SMALL);
  });

  it("logs write_file modify action correctly", async () => {
    const mockWriteFile: ToolExecutorFn = async () => ({
      success: true,
      data: {
        path: "existing-file.ts",
        action: "modified",
        bytes: EXPECTED_BYTES_MEDIUM,
      },
    });

    const executor = new ToolExecutor(new Map([["write_file", mockWriteFile]]));

    const context: ExecutionContext = {
      role: "impl",
      workspaceRoot: testWorkspace,
      auditLog: async (entry) => {
        auditEntries.push(entry);
      },
    };

    await executor.execute(
      "write_file",
      { path: "existing-file.ts", content: "updated content" },
      context
    );

    expect(auditEntries).toHaveLength(1);
    expect(auditEntries[0].action).toBe("modify");
  });

  it("logs list_files with count", async () => {
    const mockListFiles: ToolExecutorFn = async () => ({
      success: true,
      data: {
        path: "src",
        entries: [{ name: "file1.ts" }, { name: "file2.ts" }],
        count: 2,
      },
    });

    const executor = new ToolExecutor(new Map([["list_files", mockListFiles]]));

    const context: ExecutionContext = {
      role: "impl",
      workspaceRoot: testWorkspace,
      auditLog: async (entry) => {
        auditEntries.push(entry);
      },
    };

    await executor.execute("list_files", { path: "src" }, context);

    expect(auditEntries).toHaveLength(1);
    expect(auditEntries[0].tool).toBe("list_files");
    expect(auditEntries[0].count).toBe(2);
  });

  it("logs search_files with matches", async () => {
    const mockSearchFiles: ToolExecutorFn = async () => ({
      success: true,
      data: {
        query: "test",
        matches: [{ file: "test.ts", line: 1, content: "test" }],
        totalMatches: 1,
        truncated: false,
      },
    });

    const executor = new ToolExecutor(
      new Map([["search_files", mockSearchFiles]])
    );

    const context: ExecutionContext = {
      role: "impl",
      workspaceRoot: testWorkspace,
      auditLog: async (entry) => {
        auditEntries.push(entry);
      },
    };

    await executor.execute(
      "search_files",
      { query: "test", path: "packages" },
      context
    );

    expect(auditEntries).toHaveLength(1);
    expect(auditEntries[0].tool).toBe("search_files");
    expect(auditEntries[0].matches).toBe(1);
    expect(auditEntries[0].path).toBe("packages");
  });

  it("logs failed file operations with error result", async () => {
    const mockReadFile: ToolExecutorFn = async () => ({
      success: false,
      error: "File not found: missing.ts",
    });

    const executor = new ToolExecutor(new Map([["read_file", mockReadFile]]));

    const context: ExecutionContext = {
      role: "impl",
      workspaceRoot: testWorkspace,
      auditLog: async (entry) => {
        auditEntries.push(entry);
      },
    };

    await executor.execute("read_file", { path: "missing.ts" }, context);

    expect(auditEntries).toHaveLength(1);
    expect(auditEntries[0].tool).toBe("read_file");
    expect(auditEntries[0].result).toBe("error");
    expect(auditEntries[0].governance).toBe("pass");
  });

  it("logs exception as error result", async () => {
    const mockReadFile: ToolExecutorFn = async () => {
      throw new Error("Unexpected error");
    };

    const executor = new ToolExecutor(new Map([["read_file", mockReadFile]]));

    const context: ExecutionContext = {
      role: "impl",
      workspaceRoot: testWorkspace,
      auditLog: async (entry) => {
        auditEntries.push(entry);
      },
    };

    await executor.execute("read_file", { path: "test.ts" }, context);

    expect(auditEntries).toHaveLength(1);
    expect(auditEntries[0].result).toBe("error");
  });

  it("does not call auditLog when callback is not provided", async () => {
    const mockReadFile: ToolExecutorFn = async () => ({
      success: true,
      data: { path: "test.ts", content: "test", linesReturned: 1 },
    });

    const executor = new ToolExecutor(new Map([["read_file", mockReadFile]]));

    const context: ExecutionContext = {
      role: "impl",
      workspaceRoot: testWorkspace,
      // No auditLog callback
    };

    // Should not throw
    const result = await executor.execute(
      "read_file",
      { path: "test.ts" },
      context
    );
    expect(result.success).toBe(true);
  });
});
