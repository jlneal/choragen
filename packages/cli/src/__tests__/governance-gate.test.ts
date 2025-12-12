/**
 * @design-doc docs/design/core/features/role-based-tool-access.md
 * @user-intent "Verify governance gate validates tool calls using dynamic roles"
 * @test-type unit
 */

import { describe, it, expect, vi } from "vitest";
import {
  GovernanceGate,
  defaultGovernanceGate,
  type ToolCall,
} from "../runtime/governance-gate.js";
import { LockManager } from "@choragen/core";
import type { RoleManager } from "@choragen/core";

function createRoleManager(toolIds: string[]): RoleManager {
  return {
    get: vi.fn(async (roleId: string) => ({
      id: roleId,
      name: roleId,
      toolIds,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  } as unknown as RoleManager;
}

function createMockLockManager(
  lockedFiles: Map<string, string> = new Map()
): LockManager {
  const mockManager = {
    isFileLocked: vi.fn(async (filePath: string) => {
      const chainId = lockedFiles.get(filePath);
      if (chainId) {
        return { locked: true, chainId };
      }
      return { locked: false };
    }),
  } as unknown as LockManager;
  return mockManager;
}

describe("GovernanceGate (dynamic roles)", () => {
  describe("validateWithRoleId", () => {
    it("allows when role includes toolId", async () => {
      const gate = new GovernanceGate();
      const roleManager = createRoleManager(["task:complete", "read_file"]);

      const result = await gate.validateWithRoleId(
        { name: "task:complete", params: { chainId: "CHAIN-1", taskId: "001" } },
        "implementer",
        roleManager
      );

      expect(result.allowed).toBe(true);
    });

    it("returns reason when role is missing", async () => {
      const gate = new GovernanceGate();
      const roleManager = createRoleManager([]);
      vi.spyOn(roleManager, "get").mockResolvedValueOnce(null);

      const result = await gate.validateWithRoleId(
        { name: "task:complete", params: {} },
        "missing-role",
        roleManager
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Role not found");
    });

    it("returns reason when tool is not in role toolIds", async () => {
      const gate = new GovernanceGate();
      const roleManager = createRoleManager(["read_file", "task:approve"]);

      const result = await gate.validateWithRoleId(
        { name: "task:complete", params: {} },
        "reviewer",
        roleManager
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Tool not allowed for role");
    });

    it("applies file path governance for write_file", async () => {
      const gate = new GovernanceGate();
      const roleManager = createRoleManager(["write_file"]);

      const result = await gate.validateWithRoleId(
        {
          name: "write_file",
          params: { path: "docs/adr/todo/ADR-123.md", content: "" },
        },
        "implementer",
        roleManager
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("denied pattern");
    });
  });

  describe("validateAsyncWithRoleId", () => {
    it("denies when file is locked by another chain", async () => {
      const lockedFiles = new Map([["packages/core/src/index.ts", "CHAIN-OTHER"]]);
      const lockManager = createMockLockManager(lockedFiles);
      const gate = new GovernanceGate(undefined, lockManager);
      const roleManager = createRoleManager(["write_file"]);

      const result = await gate.validateAsyncWithRoleId(
        {
          name: "write_file",
          params: { path: "packages/core/src/index.ts", content: "" },
        },
        "implementer",
        roleManager,
        "CHAIN-123"
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(
        "File packages/core/src/index.ts is locked by chain CHAIN-OTHER"
      );
    });

    it("allows when role permits tool and file is available", async () => {
      const lockManager = createMockLockManager();
      const gate = new GovernanceGate(undefined, lockManager);
      const roleManager = createRoleManager(["write_file"]);

      const result = await gate.validateAsyncWithRoleId(
        {
          name: "write_file",
          params: { path: "packages/core/src/index.ts", content: "" },
        },
        "implementer",
        roleManager,
        "CHAIN-123"
      );

      expect(result.allowed).toBe(true);
    });
  });

  describe("batch helpers", () => {
    it("validateBatchWithRoleId maps calls to results", async () => {
      const gate = new GovernanceGate();
      const roleManager = createRoleManager(["chain:status"]);
      const toolCalls: ToolCall[] = [
        { name: "chain:status", params: {} },
        { name: "task:approve", params: {} },
      ];

      const results = await gate.validateBatchWithRoleId(
        toolCalls,
        "controller",
        roleManager
      );

      expect(results).toHaveLength(2);
      expect(results[0].allowed).toBe(true);
      expect(results[1].allowed).toBe(false);
    });

    it("allAllowedWithRoleId returns false when any call is denied", async () => {
      const gate = new GovernanceGate();
      const roleManager = createRoleManager(["chain:status"]);
      const toolCalls: ToolCall[] = [
        { name: "chain:status", params: {} },
        { name: "task:approve", params: {} },
      ];

      const allowed = await gate.allAllowedWithRoleId(
        toolCalls,
        "controller",
        roleManager
      );

      expect(allowed).toBe(false);
    });
  });

  describe("checkLocks", () => {
    it("returns available when no lock manager is configured", async () => {
      const gate = new GovernanceGate();

      const result = await gate.checkLocks("packages/core/src/index.ts");

      expect(result.available).toBe(true);
      expect(result.lockedBy).toBeUndefined();
    });

    it("returns unavailable with lock owner when file is locked by another chain", async () => {
      const lockedFiles = new Map([
        ["packages/core/src/index.ts", "CHAIN-OTHER"],
      ]);
      const mockManager = createMockLockManager(lockedFiles);
      const gate = new GovernanceGate(undefined, mockManager);

      const result = await gate.checkLocks(
        "packages/core/src/index.ts",
        "CHAIN-039"
      );

      expect(result.available).toBe(false);
      expect(result.lockedBy).toBe("CHAIN-OTHER");
    });
  });

  describe("validateFilePath", () => {
    it("validates file paths directly for impl role", () => {
      const gate = new GovernanceGate();

      const allowed = gate.validateFilePath(
        "packages/cli/src/index.ts",
        "impl",
        "modify"
      );
      expect(allowed.allowed).toBe(true);

      const denied = gate.validateFilePath(
        "docs/adr/todo/ADR-001.md",
        "impl",
        "create"
      );
      expect(denied.allowed).toBe(false);
      expect(denied.reason).toContain("denied pattern");
    });

    it("handles absolute paths by normalizing them", () => {
      const gate = new GovernanceGate();

      const result = gate.validateFilePath(
        "/packages/core/src/index.ts",
        "impl",
        "modify"
      );
      expect(result.allowed).toBe(true);
    });
  });
});

describe("defaultGovernanceGate", () => {
  it("is a GovernanceGate instance", () => {
    expect(defaultGovernanceGate).toBeInstanceOf(GovernanceGate);
  });
});
