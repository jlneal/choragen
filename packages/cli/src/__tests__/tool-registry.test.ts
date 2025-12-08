/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Verify tool registry correctly filters tools by agent role (control vs impl)"
 * @test-type unit
 */

import { describe, it, expect } from "vitest";
import {
  ToolRegistry,
  defaultRegistry,
  chainStatusTool,
  taskStatusTool,
  taskListTool,
  taskStartTool,
  taskCompleteTool,
  taskApproveTool,
  spawnImplSessionTool,
  toProviderTool,
} from "../runtime/tools/index.js";
import type { ToolDefinition } from "../runtime/tools/index.js";

describe("ToolRegistry", () => {
  describe("getToolsForRole", () => {
    it("returns correct tools for control role", () => {
      const registry = new ToolRegistry();
      const controlTools = registry.getToolsForRole("control");
      const toolNames = controlTools.map((t) => t.name);

      // Control role should have these tools
      expect(toolNames).toContain("chain:status");
      expect(toolNames).toContain("task:list");
      expect(toolNames).toContain("task:start");
      expect(toolNames).toContain("task:approve");
      expect(toolNames).toContain("spawn_impl_session");

      // Control role should NOT have these tools
      expect(toolNames).not.toContain("task:status");
      expect(toolNames).not.toContain("task:complete");
    });

    it("returns correct tools for impl role", () => {
      const registry = new ToolRegistry();
      const implTools = registry.getToolsForRole("impl");
      const toolNames = implTools.map((t) => t.name);

      // Impl role should have these tools
      expect(toolNames).toContain("chain:status");
      expect(toolNames).toContain("task:status");
      expect(toolNames).toContain("task:complete");

      // Impl role should NOT have these tools
      expect(toolNames).not.toContain("task:list");
      expect(toolNames).not.toContain("task:start");
      expect(toolNames).not.toContain("task:approve");
      expect(toolNames).not.toContain("spawn_impl_session");
    });

    it("control role has 5 tools", () => {
      const registry = new ToolRegistry();
      const controlTools = registry.getToolsForRole("control");
      const EXPECTED_CONTROL_TOOL_COUNT = 5;
      expect(controlTools).toHaveLength(EXPECTED_CONTROL_TOOL_COUNT);
    });

    it("impl role has 3 tools", () => {
      const registry = new ToolRegistry();
      const implTools = registry.getToolsForRole("impl");
      const EXPECTED_IMPL_TOOL_COUNT = 3;
      expect(implTools).toHaveLength(EXPECTED_IMPL_TOOL_COUNT);
    });
  });

  describe("spawn_impl_session is control-only", () => {
    it("spawn_impl_session is available to control", () => {
      const registry = new ToolRegistry();
      expect(registry.canRoleUseTool("control", "spawn_impl_session")).toBe(
        true
      );
    });

    it("spawn_impl_session is NOT available to impl", () => {
      const registry = new ToolRegistry();
      expect(registry.canRoleUseTool("impl", "spawn_impl_session")).toBe(false);
    });
  });

  describe("chain:status is shared", () => {
    it("chain:status is available to control", () => {
      const registry = new ToolRegistry();
      expect(registry.canRoleUseTool("control", "chain:status")).toBe(true);
    });

    it("chain:status is available to impl", () => {
      const registry = new ToolRegistry();
      expect(registry.canRoleUseTool("impl", "chain:status")).toBe(true);
    });
  });

  describe("getTool", () => {
    it("returns tool by name", () => {
      const registry = new ToolRegistry();
      const tool = registry.getTool("chain:status");
      expect(tool).toBeDefined();
      expect(tool?.name).toBe("chain:status");
    });

    it("returns undefined for unknown tool", () => {
      const registry = new ToolRegistry();
      const tool = registry.getTool("unknown:tool");
      expect(tool).toBeUndefined();
    });
  });

  describe("canRoleUseTool", () => {
    it("returns true for allowed tool", () => {
      const registry = new ToolRegistry();
      expect(registry.canRoleUseTool("impl", "task:complete")).toBe(true);
    });

    it("returns false for disallowed tool", () => {
      const registry = new ToolRegistry();
      expect(registry.canRoleUseTool("impl", "task:start")).toBe(false);
    });

    it("returns false for unknown tool", () => {
      const registry = new ToolRegistry();
      expect(registry.canRoleUseTool("control", "unknown:tool")).toBe(false);
    });
  });

  describe("getProviderToolsForRole", () => {
    it("returns tools without allowedRoles field", () => {
      const registry = new ToolRegistry();
      const providerTools = registry.getProviderToolsForRole("control");

      for (const tool of providerTools) {
        expect(tool).toHaveProperty("name");
        expect(tool).toHaveProperty("description");
        expect(tool).toHaveProperty("parameters");
        expect(tool).not.toHaveProperty("allowedRoles");
      }
    });
  });

  describe("registerTool", () => {
    it("adds a new tool", () => {
      const registry = new ToolRegistry([]);
      const customTool: ToolDefinition = {
        name: "custom:tool",
        description: "A custom tool",
        parameters: {
          type: "object",
          properties: {},
        },
        allowedRoles: ["control"],
      };

      registry.registerTool(customTool);
      expect(registry.getTool("custom:tool")).toBeDefined();
    });

    it("replaces existing tool with same name", () => {
      const registry = new ToolRegistry([chainStatusTool]);
      const updatedTool: ToolDefinition = {
        ...chainStatusTool,
        description: "Updated description",
      };

      registry.registerTool(updatedTool);
      const tool = registry.getTool("chain:status");
      expect(tool?.description).toBe("Updated description");
      expect(registry.getAllTools()).toHaveLength(1);
    });
  });

  describe("getAllTools", () => {
    it("returns all registered tools", () => {
      const registry = new ToolRegistry();
      const allTools = registry.getAllTools();
      const EXPECTED_TOTAL_TOOL_COUNT = 7;
      expect(allTools).toHaveLength(EXPECTED_TOTAL_TOOL_COUNT);
    });
  });
});

describe("Tool definitions", () => {
  describe("chainStatusTool", () => {
    it("has correct structure", () => {
      expect(chainStatusTool.name).toBe("chain:status");
      expect(chainStatusTool.allowedRoles).toContain("control");
      expect(chainStatusTool.allowedRoles).toContain("impl");
      expect(chainStatusTool.parameters.required).toContain("chainId");
    });
  });

  describe("taskStatusTool", () => {
    it("is impl-only", () => {
      expect(taskStatusTool.allowedRoles).toEqual(["impl"]);
    });

    it("requires chainId and taskId", () => {
      expect(taskStatusTool.parameters.required).toContain("chainId");
      expect(taskStatusTool.parameters.required).toContain("taskId");
    });
  });

  describe("taskListTool", () => {
    it("is control-only", () => {
      expect(taskListTool.allowedRoles).toEqual(["control"]);
    });

    it("has optional status filter", () => {
      expect(taskListTool.parameters.properties.status).toBeDefined();
      expect(taskListTool.parameters.required).not.toContain("status");
    });
  });

  describe("taskStartTool", () => {
    it("is control-only", () => {
      expect(taskStartTool.allowedRoles).toEqual(["control"]);
    });
  });

  describe("taskCompleteTool", () => {
    it("is impl-only", () => {
      expect(taskCompleteTool.allowedRoles).toEqual(["impl"]);
    });

    it("has optional summary parameter", () => {
      expect(taskCompleteTool.parameters.properties.summary).toBeDefined();
      expect(taskCompleteTool.parameters.required).not.toContain("summary");
    });
  });

  describe("taskApproveTool", () => {
    it("is control-only", () => {
      expect(taskApproveTool.allowedRoles).toEqual(["control"]);
    });
  });

  describe("spawnImplSessionTool", () => {
    it("is control-only", () => {
      expect(spawnImplSessionTool.allowedRoles).toEqual(["control"]);
    });

    it("has optional context parameter", () => {
      expect(spawnImplSessionTool.parameters.properties.context).toBeDefined();
      expect(spawnImplSessionTool.parameters.required).not.toContain("context");
    });
  });
});

describe("toProviderTool", () => {
  it("strips allowedRoles from tool definition", () => {
    const providerTool = toProviderTool(chainStatusTool);

    expect(providerTool.name).toBe(chainStatusTool.name);
    expect(providerTool.description).toBe(chainStatusTool.description);
    expect(providerTool.parameters).toEqual(chainStatusTool.parameters);
    expect(providerTool).not.toHaveProperty("allowedRoles");
  });
});

describe("defaultRegistry", () => {
  it("is a ToolRegistry instance", () => {
    expect(defaultRegistry).toBeInstanceOf(ToolRegistry);
  });

  it("contains all Phase 1 tools", () => {
    const allTools = defaultRegistry.getAllTools();
    const toolNames = allTools.map((t) => t.name);

    expect(toolNames).toContain("chain:status");
    expect(toolNames).toContain("task:status");
    expect(toolNames).toContain("task:list");
    expect(toolNames).toContain("task:start");
    expect(toolNames).toContain("task:complete");
    expect(toolNames).toContain("task:approve");
    expect(toolNames).toContain("spawn_impl_session");
  });
});
