/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Verify complete file operations flow including governance and lock checking"
 * @test-type integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdir, rm, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { GovernanceGate } from "../runtime/governance-gate.js";
import type { ToolCall } from "../runtime/governance-gate.js";
import {
  ToolExecutor,
  buildDeniedAuditEntry,
  type ExecutionContext,
} from "../runtime/tools/executor.js";
import { executeReadFile } from "../runtime/tools/definitions/read-file.js";
import { executeWriteFile } from "../runtime/tools/definitions/write-file.js";
import type { AuditLogEntry } from "../runtime/session.js";
import { LockManager } from "@choragen/core";

describe("File Operations Integration", () => {
  let testWorkspace: string;
  let gate: GovernanceGate;

  beforeEach(async () => {
    testWorkspace = join(tmpdir(), `choragen-file-ops-test-${Date.now()}`);
    await mkdir(testWorkspace, { recursive: true });
    gate = new GovernanceGate();
  });

  afterEach(async () => {
    await rm(testWorkspace, { recursive: true, force: true });
  });

  describe("read_file", () => {
    it("impl can read source files", async () => {
      // Setup: create a source file
      const srcDir = join(testWorkspace, "packages/core/src");
      await mkdir(srcDir, { recursive: true });
      await writeFile(join(srcDir, "index.ts"), "export const foo = 1;\n");

      const context: ExecutionContext = {
        role: "impl",
        workspaceRoot: testWorkspace,
      };

      const result = await executeReadFile(
        { path: "packages/core/src/index.ts" },
        context
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      const data = result.data as { content: string };
      expect(data.content).toContain("export const foo = 1;");
    });

    it("impl can read docs files", async () => {
      // Setup: create a docs file
      const docsDir = join(testWorkspace, "docs/design");
      await mkdir(docsDir, { recursive: true });
      await writeFile(join(docsDir, "feature.md"), "# Feature\n\nDescription");

      const context: ExecutionContext = {
        role: "impl",
        workspaceRoot: testWorkspace,
      };

      const result = await executeReadFile(
        { path: "docs/design/feature.md" },
        context
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      const data = result.data as { content: string };
      expect(data.content).toContain("# Feature");
    });

    it("control can read source files", async () => {
      // Setup: create a source file
      const srcDir = join(testWorkspace, "packages/cli/src");
      await mkdir(srcDir, { recursive: true });
      await writeFile(join(srcDir, "index.ts"), "console.log('hello');\n");

      const context: ExecutionContext = {
        role: "control",
        workspaceRoot: testWorkspace,
      };

      const result = await executeReadFile(
        { path: "packages/cli/src/index.ts" },
        context
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      const data = result.data as { content: string };
      expect(data.content).toContain("console.log");
    });

    it("returns error for non-existent file", async () => {
      const context: ExecutionContext = {
        role: "impl",
        workspaceRoot: testWorkspace,
      };

      const result = await executeReadFile(
        { path: "nonexistent/file.ts" },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("File not found");
    });

    it("supports offset and limit for large files", async () => {
      // Setup: create a file with multiple lines
      const srcDir = join(testWorkspace, "packages/core/src");
      await mkdir(srcDir, { recursive: true });
      const lines = Array.from({ length: 100 }, (_, i) => `line ${i + 1}`);
      await writeFile(join(srcDir, "large.ts"), lines.join("\n"));

      const context: ExecutionContext = {
        role: "impl",
        workspaceRoot: testWorkspace,
      };

      const result = await executeReadFile(
        { path: "packages/core/src/large.ts", offset: 10, limit: 5 },
        context
      );

      expect(result.success).toBe(true);
      const data = result.data as {
        startLine: number;
        endLine: number;
        linesReturned: number;
        content: string;
      };
      expect(data.startLine).toBe(10);
      expect(data.endLine).toBe(14);
      expect(data.linesReturned).toBe(5);
      expect(data.content).toContain("line 10");
      expect(data.content).toContain("line 14");
      expect(data.content).not.toContain("line 9");
      expect(data.content).not.toContain("line 15");
    });
  });

  describe("write_file", () => {
    it("impl can write to packages/**/src/**", async () => {
      // First verify governance allows it
      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "packages/core/src/new-file.ts",
          content: "export const bar = 2;",
        },
      };
      const validation = gate.validate(toolCall, "impl");
      expect(validation.allowed).toBe(true);

      // Then execute the write
      const srcDir = join(testWorkspace, "packages/core/src");
      await mkdir(srcDir, { recursive: true });

      const context: ExecutionContext = {
        role: "impl",
        workspaceRoot: testWorkspace,
      };

      const result = await executeWriteFile(
        { path: "packages/core/src/new-file.ts", content: "export const bar = 2;" },
        context
      );

      expect(result.success).toBe(true);
      const data = result.data as { action: string; bytes: number };
      expect(data.action).toBe("created");
      expect(data.bytes).toBeGreaterThan(0);

      // Verify file was written
      const content = await readFile(
        join(testWorkspace, "packages/core/src/new-file.ts"),
        "utf-8"
      );
      expect(content).toBe("export const bar = 2;");
    });

    it("impl can write to packages/**/__tests__/**", async () => {
      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "packages/cli/src/__tests__/new.test.ts",
          content: "describe('test', () => {});",
        },
      };
      const validation = gate.validate(toolCall, "impl");
      expect(validation.allowed).toBe(true);

      const testDir = join(testWorkspace, "packages/cli/src/__tests__");
      await mkdir(testDir, { recursive: true });

      const context: ExecutionContext = {
        role: "impl",
        workspaceRoot: testWorkspace,
      };

      const result = await executeWriteFile(
        {
          path: "packages/cli/src/__tests__/new.test.ts",
          content: "describe('test', () => {});",
        },
        context
      );

      expect(result.success).toBe(true);
    });

    it("impl is denied writing to docs/adr/**", () => {
      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "docs/adr/todo/ADR-999.md",
          content: "# ADR",
        },
      };

      const result = gate.validate(toolCall, "impl");

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("denied pattern");
      expect(result.reason).toContain("docs/adr/**");
    });

    it("impl is denied writing to docs/requests/**", () => {
      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "docs/requests/change-requests/todo/CR-999.md",
          content: "# CR",
        },
      };

      const result = gate.validate(toolCall, "impl");

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("denied pattern");
      expect(result.reason).toContain("docs/requests/**");
    });

    it("control cannot use write_file", () => {
      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "docs/adr/todo/ADR-001.md",
          content: "# ADR",
        },
      };

      const result = gate.validate(toolCall, "control");

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("not available to control role");
    });

    it("createOnly fails if file exists", async () => {
      const srcDir = join(testWorkspace, "packages/core/src");
      await mkdir(srcDir, { recursive: true });
      await writeFile(join(srcDir, "existing.ts"), "original content");

      const context: ExecutionContext = {
        role: "impl",
        workspaceRoot: testWorkspace,
      };

      const result = await executeWriteFile(
        {
          path: "packages/core/src/existing.ts",
          content: "new content",
          createOnly: true,
        },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("already exists");
    });

    it("creates parent directories", async () => {
      const context: ExecutionContext = {
        role: "impl",
        workspaceRoot: testWorkspace,
      };

      const result = await executeWriteFile(
        {
          path: "packages/new-pkg/src/deep/nested/file.ts",
          content: "export {};",
        },
        context
      );

      expect(result.success).toBe(true);

      // Verify file was created with parent directories
      const content = await readFile(
        join(testWorkspace, "packages/new-pkg/src/deep/nested/file.ts"),
        "utf-8"
      );
      expect(content).toBe("export {};");
    });
  });

  describe("governance integration", () => {
    it("validates file path against role patterns", () => {
      // impl allowed paths
      expect(
        gate.validateFilePath("packages/core/src/index.ts", "impl", "modify")
          .allowed
      ).toBe(true);
      expect(
        gate.validateFilePath(
          "packages/cli/src/__tests__/test.ts",
          "impl",
          "create"
        ).allowed
      ).toBe(true);

      // impl denied paths
      expect(
        gate.validateFilePath("docs/adr/todo/ADR-001.md", "impl", "create")
          .allowed
      ).toBe(false);
      expect(
        gate.validateFilePath("docs/tasks/todo/task.md", "impl", "modify")
          .allowed
      ).toBe(false);

      // control allowed paths
      expect(
        gate.validateFilePath("docs/adr/todo/ADR-001.md", "control", "create")
          .allowed
      ).toBe(true);
      expect(
        gate.validateFilePath(
          "docs/requests/change-requests/todo/CR-001.md",
          "control",
          "modify"
        ).allowed
      ).toBe(true);

      // control denied paths
      expect(
        gate.validateFilePath("packages/core/src/index.ts", "control", "modify")
          .allowed
      ).toBe(false);
    });

    it("returns clear error message on violation", () => {
      const result = gate.validateFilePath(
        "docs/adr/doing/ADR-010.md",
        "impl",
        "modify"
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(
        "Role impl cannot modify docs/adr/doing/ADR-010.md - matches denied pattern docs/adr/**"
      );
    });
  });

  describe("lock integration", () => {
    /**
     * Create a mock LockManager for testing.
     */
    function createMockLockManager(
      lockedFiles: Map<string, string> = new Map()
    ): LockManager {
      return {
        isFileLocked: vi.fn(async (filePath: string) => {
          const chainId = lockedFiles.get(filePath);
          if (chainId) {
            return { locked: true, chainId };
          }
          return { locked: false };
        }),
      } as unknown as LockManager;
    }

    it("allows write when no lock exists", async () => {
      const mockManager = createMockLockManager();
      const gateWithLocks = new GovernanceGate(undefined, mockManager);

      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "packages/core/src/index.ts",
          content: "export {};",
        },
      };

      const result = await gateWithLocks.validateAsync(
        toolCall,
        "impl",
        "CHAIN-039"
      );

      expect(result.allowed).toBe(true);
    });

    it("allows write when current chain holds lock", async () => {
      const lockedFiles = new Map([
        ["packages/core/src/index.ts", "CHAIN-039"],
      ]);
      const mockManager = createMockLockManager(lockedFiles);
      const gateWithLocks = new GovernanceGate(undefined, mockManager);

      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "packages/core/src/index.ts",
          content: "export {};",
        },
      };

      const result = await gateWithLocks.validateAsync(
        toolCall,
        "impl",
        "CHAIN-039"
      );

      expect(result.allowed).toBe(true);
    });

    it("denies write when another chain holds lock", async () => {
      const lockedFiles = new Map([
        ["packages/core/src/index.ts", "CHAIN-OTHER"],
      ]);
      const mockManager = createMockLockManager(lockedFiles);
      const gateWithLocks = new GovernanceGate(undefined, mockManager);

      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "packages/core/src/index.ts",
          content: "export {};",
        },
      };

      const result = await gateWithLocks.validateAsync(
        toolCall,
        "impl",
        "CHAIN-039"
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(
        "File packages/core/src/index.ts is locked by chain CHAIN-OTHER"
      );
    });
  });

  describe("audit logging", () => {
    let auditEntries: Omit<AuditLogEntry, "timestamp" | "session">[];

    beforeEach(() => {
      auditEntries = [];
    });

    it("logs successful read operations", async () => {
      const srcDir = join(testWorkspace, "packages/core/src");
      await mkdir(srcDir, { recursive: true });
      await writeFile(join(srcDir, "index.ts"), "export {};");

      const executor = new ToolExecutor(
        new Map([["read_file", executeReadFile]])
      );

      const context: ExecutionContext = {
        role: "impl",
        workspaceRoot: testWorkspace,
        auditLog: async (entry) => {
          auditEntries.push(entry);
        },
      };

      await executor.execute(
        "read_file",
        { path: "packages/core/src/index.ts" },
        context
      );

      expect(auditEntries).toHaveLength(1);
      expect(auditEntries[0].tool).toBe("read_file");
      expect(auditEntries[0].path).toBe("packages/core/src/index.ts");
      expect(auditEntries[0].result).toBe("success");
      expect(auditEntries[0].governance).toBe("pass");
    });

    it("logs successful write operations", async () => {
      const srcDir = join(testWorkspace, "packages/core/src");
      await mkdir(srcDir, { recursive: true });

      const executor = new ToolExecutor(
        new Map([["write_file", executeWriteFile]])
      );

      const context: ExecutionContext = {
        role: "impl",
        workspaceRoot: testWorkspace,
        auditLog: async (entry) => {
          auditEntries.push(entry);
        },
      };

      await executor.execute(
        "write_file",
        { path: "packages/core/src/new.ts", content: "export {};" },
        context
      );

      expect(auditEntries).toHaveLength(1);
      expect(auditEntries[0].tool).toBe("write_file");
      expect(auditEntries[0].path).toBe("packages/core/src/new.ts");
      expect(auditEntries[0].result).toBe("success");
      // Note: action is set to "create" when data.action === "created"
      // The buildAuditEntry maps "created" -> "create" and "modified" -> "modify"
      expect(auditEntries[0].action).toBe("create");
      expect(auditEntries[0].governance).toBe("pass");
    });

    it("logs denied operations with reason", () => {
      const entry = buildDeniedAuditEntry(
        "write_file",
        { path: "docs/adr/todo/ADR-001.md", content: "# ADR" },
        "Role impl cannot modify docs/adr/todo/ADR-001.md - matches denied pattern docs/adr/**"
      );

      expect(entry.tool).toBe("write_file");
      expect(entry.path).toBe("docs/adr/todo/ADR-001.md");
      expect(entry.result).toBe("denied");
      expect(entry.governance).toBe("deny");
      expect(entry.reason).toContain("denied pattern");
    });
  });
});
