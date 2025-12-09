/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Verify governance gate correctly validates tool calls by agent role"
 * @test-type unit
 */

import { describe, it, expect } from "vitest";
import {
  GovernanceGate,
  defaultGovernanceGate,
} from "../runtime/governance-gate.js";
import type { ToolCall } from "../runtime/governance-gate.js";
import { ToolRegistry } from "../runtime/tools/registry.js";
import type { ToolDefinition } from "../runtime/tools/types.js";
import { LockManager } from "@choragen/core";
import { vi } from "vitest";

describe("GovernanceGate", () => {
  describe("validate", () => {
    describe("control role validation", () => {
      it("allows control role to use control-only tools", () => {
        const gate = new GovernanceGate();
        const toolCall: ToolCall = {
          name: "task:approve",
          params: { chainId: "CHAIN-001", taskId: "001" },
        };

        const result = gate.validate(toolCall, "control");

        expect(result.allowed).toBe(true);
        expect(result.reason).toBeUndefined();
      });

      it("allows control role to use shared tools", () => {
        const gate = new GovernanceGate();
        const toolCall: ToolCall = {
          name: "chain:status",
          params: { chainId: "CHAIN-001" },
        };

        const result = gate.validate(toolCall, "control");

        expect(result.allowed).toBe(true);
        expect(result.reason).toBeUndefined();
      });

      it("denies control role from using impl-only tools", () => {
        const gate = new GovernanceGate();
        const toolCall: ToolCall = {
          name: "task:complete",
          params: { chainId: "CHAIN-001", taskId: "001" },
        };

        const result = gate.validate(toolCall, "control");

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe(
          "Tool task:complete is not available to control role"
        );
      });
    });

    describe("impl role validation", () => {
      it("allows impl role to use impl-only tools", () => {
        const gate = new GovernanceGate();
        const toolCall: ToolCall = {
          name: "task:complete",
          params: { chainId: "CHAIN-001", taskId: "001" },
        };

        const result = gate.validate(toolCall, "impl");

        expect(result.allowed).toBe(true);
        expect(result.reason).toBeUndefined();
      });

      it("allows impl role to use shared tools", () => {
        const gate = new GovernanceGate();
        const toolCall: ToolCall = {
          name: "chain:status",
          params: { chainId: "CHAIN-001" },
        };

        const result = gate.validate(toolCall, "impl");

        expect(result.allowed).toBe(true);
        expect(result.reason).toBeUndefined();
      });

      it("denies impl role from using control-only tools", () => {
        const gate = new GovernanceGate();
        const toolCall: ToolCall = {
          name: "task:approve",
          params: { chainId: "CHAIN-001", taskId: "001" },
        };

        const result = gate.validate(toolCall, "impl");

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe(
          "Tool task:approve is not available to impl role"
        );
      });

      it("denies impl role from using spawn_impl_session", () => {
        const gate = new GovernanceGate();
        const toolCall: ToolCall = {
          name: "spawn_impl_session",
          params: { chainId: "CHAIN-001", taskId: "001" },
        };

        const result = gate.validate(toolCall, "impl");

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe(
          "Tool spawn_impl_session is not available to impl role"
        );
      });
    });

    describe("unknown tool validation", () => {
      it("denies unknown tools for control role", () => {
        const gate = new GovernanceGate();
        const toolCall: ToolCall = {
          name: "unknown:tool",
          params: {},
        };

        const result = gate.validate(toolCall, "control");

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe("Unknown tool: unknown:tool");
      });

      it("denies unknown tools for impl role", () => {
        const gate = new GovernanceGate();
        const toolCall: ToolCall = {
          name: "nonexistent:command",
          params: {},
        };

        const result = gate.validate(toolCall, "impl");

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe("Unknown tool: nonexistent:command");
      });
    });

    describe("error message clarity", () => {
      it("provides actionable error for role violation", () => {
        const gate = new GovernanceGate();
        const toolCall: ToolCall = {
          name: "task:start",
          params: { chainId: "CHAIN-001", taskId: "001" },
        };

        const result = gate.validate(toolCall, "impl");

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("task:start");
        expect(result.reason).toContain("impl role");
      });

      it("provides actionable error for unknown tool", () => {
        const gate = new GovernanceGate();
        const toolCall: ToolCall = {
          name: "fake:tool",
          params: {},
        };

        const result = gate.validate(toolCall, "control");

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("fake:tool");
        expect(result.reason).toContain("Unknown");
      });
    });
  });

  describe("validateBatch", () => {
    it("validates multiple tool calls", () => {
      const gate = new GovernanceGate();
      const toolCalls: ToolCall[] = [
        { name: "chain:status", params: { chainId: "CHAIN-001" } },
        { name: "task:approve", params: { chainId: "CHAIN-001", taskId: "001" } },
      ];

      const results = gate.validateBatch(toolCalls, "control");

      expect(results).toHaveLength(2);
      expect(results[0].allowed).toBe(true);
      expect(results[1].allowed).toBe(true);
    });

    it("returns mixed results for mixed validity", () => {
      const gate = new GovernanceGate();
      const toolCalls: ToolCall[] = [
        { name: "chain:status", params: { chainId: "CHAIN-001" } },
        { name: "task:approve", params: { chainId: "CHAIN-001", taskId: "001" } },
      ];

      const results = gate.validateBatch(toolCalls, "impl");

      expect(results).toHaveLength(2);
      expect(results[0].allowed).toBe(true); // chain:status is shared
      expect(results[1].allowed).toBe(false); // task:approve is control-only
    });

    it("handles empty batch", () => {
      const gate = new GovernanceGate();
      const results = gate.validateBatch([], "control");

      expect(results).toHaveLength(0);
    });
  });

  describe("allAllowed", () => {
    it("returns true when all calls are allowed", () => {
      const gate = new GovernanceGate();
      const toolCalls: ToolCall[] = [
        { name: "chain:status", params: { chainId: "CHAIN-001" } },
        { name: "task:approve", params: { chainId: "CHAIN-001", taskId: "001" } },
        { name: "task:start", params: { chainId: "CHAIN-001", taskId: "001" } },
      ];

      expect(gate.allAllowed(toolCalls, "control")).toBe(true);
    });

    it("returns false when any call is denied", () => {
      const gate = new GovernanceGate();
      const toolCalls: ToolCall[] = [
        { name: "chain:status", params: { chainId: "CHAIN-001" } },
        { name: "task:approve", params: { chainId: "CHAIN-001", taskId: "001" } },
      ];

      expect(gate.allAllowed(toolCalls, "impl")).toBe(false);
    });

    it("returns true for empty batch", () => {
      const gate = new GovernanceGate();
      expect(gate.allAllowed([], "impl")).toBe(true);
    });
  });

  describe("custom registry", () => {
    it("uses provided registry for validation", () => {
      const customTool: ToolDefinition = {
        name: "custom:tool",
        description: "A custom tool",
        parameters: { type: "object", properties: {} },
        allowedRoles: ["impl"],
      };
      const registry = new ToolRegistry([customTool]);
      const gate = new GovernanceGate(registry);

      const toolCall: ToolCall = { name: "custom:tool", params: {} };

      expect(gate.validate(toolCall, "impl").allowed).toBe(true);
      expect(gate.validate(toolCall, "control").allowed).toBe(false);
    });
  });
});

describe("defaultGovernanceGate", () => {
  it("is a GovernanceGate instance", () => {
    expect(defaultGovernanceGate).toBeInstanceOf(GovernanceGate);
  });

  it("validates using default registry", () => {
    const toolCall: ToolCall = {
      name: "chain:status",
      params: { chainId: "CHAIN-001" },
    };

    const result = defaultGovernanceGate.validate(toolCall, "control");

    expect(result.allowed).toBe(true);
  });
});

describe("ValidationResult interface", () => {
  it("allowed result has no reason", () => {
    const gate = new GovernanceGate();
    const result = gate.validate(
      { name: "chain:status", params: {} },
      "control"
    );

    expect(result).toEqual({ allowed: true });
  });

  it("denied result has reason", () => {
    const gate = new GovernanceGate();
    const result = gate.validate(
      { name: "task:approve", params: {} },
      "impl"
    );

    expect(result.allowed).toBe(false);
    expect(typeof result.reason).toBe("string");
    expect(result.reason!.length).toBeGreaterThan(0);
  });
});

describe("Phase 3: File path validation for write_file", () => {
  describe("impl role file path validation", () => {
    it("allows impl to write to packages/**/src/**/*.ts", () => {
      const gate = new GovernanceGate();
      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "packages/core/src/index.ts",
          content: "export {}",
        },
      };

      const result = gate.validate(toolCall, "impl");

      expect(result.allowed).toBe(true);
    });

    it("allows impl to write to packages/**/__tests__/**/*.ts", () => {
      const gate = new GovernanceGate();
      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "packages/cli/src/__tests__/example.test.ts",
          content: "test code",
        },
      };

      const result = gate.validate(toolCall, "impl");

      expect(result.allowed).toBe(true);
    });

    it("allows impl to write to packages/**/src/**/*.json", () => {
      const gate = new GovernanceGate();
      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "packages/core/src/config.json",
          content: "{}",
        },
      };

      const result = gate.validate(toolCall, "impl");

      expect(result.allowed).toBe(true);
    });

    it("allows impl to write to README.md files", () => {
      const gate = new GovernanceGate();
      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "packages/core/README.md",
          content: "# Core",
        },
      };

      const result = gate.validate(toolCall, "impl");

      expect(result.allowed).toBe(true);
    });

    it("denies impl from writing to docs/tasks/**", () => {
      const gate = new GovernanceGate();
      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "docs/tasks/todo/CHAIN-001/task.md",
          content: "task content",
        },
      };

      const result = gate.validate(toolCall, "impl");

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("impl");
      expect(result.reason).toContain("denied pattern");
      expect(result.reason).toContain("docs/tasks/**");
    });

    it("denies impl from writing to docs/requests/**", () => {
      const gate = new GovernanceGate();
      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "docs/requests/change-requests/todo/CR-001.md",
          content: "request content",
        },
      };

      const result = gate.validate(toolCall, "impl");

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("denied pattern");
      expect(result.reason).toContain("docs/requests/**");
    });

    it("denies impl from writing to docs/adr/**", () => {
      const gate = new GovernanceGate();
      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "docs/adr/todo/ADR-010.md",
          content: "adr content",
        },
      };

      const result = gate.validate(toolCall, "impl");

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("denied pattern");
      expect(result.reason).toContain("docs/adr/**");
    });

    it("denies impl from writing to unrecognized paths", () => {
      const gate = new GovernanceGate();
      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "random/unknown/file.txt",
          content: "content",
        },
      };

      const result = gate.validate(toolCall, "impl");

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("does not match any allowed pattern");
    });
  });

  describe("control role file path validation", () => {
    it("denies control from writing to packages/**/src/**/*.ts", () => {
      const gate = new GovernanceGate();
      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "packages/core/src/index.ts",
          content: "export {}",
        },
      };

      // Note: control role cannot use write_file at all (role-based denial)
      const result = gate.validate(toolCall, "control");

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("not available to control role");
    });
  });

  describe("validateFilePath method", () => {
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

    it("validates file paths directly for control role", () => {
      const gate = new GovernanceGate();

      const allowed = gate.validateFilePath(
        "docs/requests/change-requests/todo/CR-001.md",
        "control",
        "create"
      );
      expect(allowed.allowed).toBe(true);

      const denied = gate.validateFilePath(
        "packages/core/src/index.ts",
        "control",
        "modify"
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

    it("includes action in error message", () => {
      const gate = new GovernanceGate();

      const result = gate.validateFilePath(
        "docs/adr/todo/ADR-001.md",
        "impl",
        "delete"
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("delete");
    });
  });

  describe("error message clarity", () => {
    it("provides actionable error for denied pattern match", () => {
      const gate = new GovernanceGate();
      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "docs/adr/doing/ADR-010.md",
          content: "content",
        },
      };

      const result = gate.validate(toolCall, "impl");

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(
        "Role impl cannot modify docs/adr/doing/ADR-010.md - matches denied pattern docs/adr/**"
      );
    });

    it("provides actionable error for no allowed pattern match", () => {
      const gate = new GovernanceGate();
      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "some/random/path.xyz",
          content: "content",
        },
      };

      const result = gate.validate(toolCall, "impl");

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(
        "Role impl cannot modify some/random/path.xyz - does not match any allowed pattern"
      );
    });
  });
});

describe("Phase 4: Lock integration for file writes", () => {
  /**
   * Create a mock LockManager for testing.
   */
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

  describe("checkLocks method", () => {
    it("returns available when no lock manager is configured", async () => {
      const gate = new GovernanceGate();

      const result = await gate.checkLocks("packages/core/src/index.ts");

      expect(result.available).toBe(true);
      expect(result.lockedBy).toBeUndefined();
    });

    it("returns available when file is not locked", async () => {
      const mockManager = createMockLockManager();
      const gate = new GovernanceGate(undefined, mockManager);

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

    it("returns available when file is locked by the same chain", async () => {
      const lockedFiles = new Map([
        ["packages/core/src/index.ts", "CHAIN-039"],
      ]);
      const mockManager = createMockLockManager(lockedFiles);
      const gate = new GovernanceGate(undefined, mockManager);

      const result = await gate.checkLocks(
        "packages/core/src/index.ts",
        "CHAIN-039"
      );

      expect(result.available).toBe(true);
      expect(result.lockedBy).toBeUndefined();
    });

    it("returns available when no chainId is provided and file is locked", async () => {
      // When no chainId is provided, we can't compare, so locked files block
      const lockedFiles = new Map([
        ["packages/core/src/index.ts", "CHAIN-OTHER"],
      ]);
      const mockManager = createMockLockManager(lockedFiles);
      const gate = new GovernanceGate(undefined, mockManager);

      const result = await gate.checkLocks("packages/core/src/index.ts");

      expect(result.available).toBe(false);
      expect(result.lockedBy).toBe("CHAIN-OTHER");
    });
  });

  describe("validateAsync method", () => {
    it("allows write_file when file is not locked", async () => {
      const mockManager = createMockLockManager();
      const gate = new GovernanceGate(undefined, mockManager);
      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "packages/core/src/index.ts",
          content: "export {}",
        },
      };

      const result = await gate.validateAsync(toolCall, "impl", "CHAIN-039");

      expect(result.allowed).toBe(true);
    });

    it("denies write_file when file is locked by another chain", async () => {
      const lockedFiles = new Map([
        ["packages/core/src/index.ts", "CHAIN-OTHER"],
      ]);
      const mockManager = createMockLockManager(lockedFiles);
      const gate = new GovernanceGate(undefined, mockManager);
      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "packages/core/src/index.ts",
          content: "export {}",
        },
      };

      const result = await gate.validateAsync(toolCall, "impl", "CHAIN-039");

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(
        "File packages/core/src/index.ts is locked by chain CHAIN-OTHER"
      );
    });

    it("allows write_file when file is locked by the same chain", async () => {
      const lockedFiles = new Map([
        ["packages/core/src/index.ts", "CHAIN-039"],
      ]);
      const mockManager = createMockLockManager(lockedFiles);
      const gate = new GovernanceGate(undefined, mockManager);
      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "packages/core/src/index.ts",
          content: "export {}",
        },
      };

      const result = await gate.validateAsync(toolCall, "impl", "CHAIN-039");

      expect(result.allowed).toBe(true);
    });

    it("still enforces role-based validation before lock checking", async () => {
      const mockManager = createMockLockManager();
      const gate = new GovernanceGate(undefined, mockManager);
      const toolCall: ToolCall = {
        name: "task:approve",
        params: { chainId: "CHAIN-001", taskId: "001" },
      };

      const result = await gate.validateAsync(toolCall, "impl", "CHAIN-039");

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(
        "Tool task:approve is not available to impl role"
      );
    });

    it("still enforces file path governance before lock checking", async () => {
      const mockManager = createMockLockManager();
      const gate = new GovernanceGate(undefined, mockManager);
      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "docs/adr/todo/ADR-001.md",
          content: "content",
        },
      };

      const result = await gate.validateAsync(toolCall, "impl", "CHAIN-039");

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("denied pattern");
    });

    it("works without lock manager (no lock checking)", async () => {
      const gate = new GovernanceGate();
      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "packages/core/src/index.ts",
          content: "export {}",
        },
      };

      const result = await gate.validateAsync(toolCall, "impl", "CHAIN-039");

      expect(result.allowed).toBe(true);
    });
  });

  describe("error message clarity", () => {
    it("provides clear error message with lock owner", async () => {
      const lockedFiles = new Map([
        ["packages/cli/src/commands/chain.ts", "CHAIN-038-other-feature"],
      ]);
      const mockManager = createMockLockManager(lockedFiles);
      const gate = new GovernanceGate(undefined, mockManager);
      const toolCall: ToolCall = {
        name: "write_file",
        params: {
          path: "packages/cli/src/commands/chain.ts",
          content: "content",
        },
      };

      const result = await gate.validateAsync(toolCall, "impl", "CHAIN-039");

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(
        "File packages/cli/src/commands/chain.ts is locked by chain CHAIN-038-other-feature"
      );
    });
  });

  describe("validation flow order", () => {
    it("follows correct order: role → governance → locks", async () => {
      // This test verifies the validation flow by checking that
      // role validation happens before governance, which happens before locks
      const lockedFiles = new Map([
        ["packages/core/src/index.ts", "CHAIN-OTHER"],
      ]);
      const mockManager = createMockLockManager(lockedFiles);
      const gate = new GovernanceGate(undefined, mockManager);

      // 1. Role check fails first (control can't use write_file)
      const controlResult = await gate.validateAsync(
        {
          name: "write_file",
          params: { path: "packages/core/src/index.ts", content: "" },
        },
        "control",
        "CHAIN-039"
      );
      expect(controlResult.allowed).toBe(false);
      expect(controlResult.reason).toContain("not available to control role");

      // 2. Governance check fails second (impl can't write to docs/adr)
      const govResult = await gate.validateAsync(
        {
          name: "write_file",
          params: { path: "docs/adr/todo/ADR-001.md", content: "" },
        },
        "impl",
        "CHAIN-039"
      );
      expect(govResult.allowed).toBe(false);
      expect(govResult.reason).toContain("denied pattern");

      // 3. Lock check fails last (file is locked by another chain)
      const lockResult = await gate.validateAsync(
        {
          name: "write_file",
          params: { path: "packages/core/src/index.ts", content: "" },
        },
        "impl",
        "CHAIN-039"
      );
      expect(lockResult.allowed).toBe(false);
      expect(lockResult.reason).toContain("locked by chain");
    });
  });
});
