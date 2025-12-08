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

describe("Phase 1 scope verification", () => {
  it("validates role-based access only (no file path validation)", () => {
    const gate = new GovernanceGate();
    // Phase 1 should not validate file paths in params
    const toolCall: ToolCall = {
      name: "chain:status",
      params: {
        chainId: "CHAIN-001",
        // These file paths should be ignored in Phase 1
        filePath: "/packages/core/src/secret.ts",
        targetFile: "/docs/adr/todo/ADR-999.md",
      },
    };

    const result = gate.validate(toolCall, "impl");

    // Should pass because role-based validation passes
    // File path validation is Phase 3
    expect(result.allowed).toBe(true);
  });
});
