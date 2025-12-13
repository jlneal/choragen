/**
 * @design-doc docs/design/core/features/role-based-tool-access.md
 * @user-intent "Verify tool registry resolves tools via dynamic roles"
 * @test-type unit
 */

import { describe, it, expect, vi } from "vitest";
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
  readFileTool,
  writeFileTool,
  listFilesTool,
  searchFilesTool,
  toProviderTool,
} from "../runtime/tools/index.js";
import type { ToolDefinition } from "../runtime/tools/index.js";
import type { RoleManager } from "@choragen/core";

function createRoleManager(roleMap: Record<string, string[]>): RoleManager {
  return {
    get: vi.fn(async (roleId: string) => {
      const toolIds = roleMap[roleId];
      if (!toolIds) return null;
      return {
        id: roleId,
        name: roleId,
        toolIds,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),
  } as unknown as RoleManager;
}

describe("ToolRegistry", () => {
  describe("getToolsForRoleId", () => {
    it("returns tools that match the role's toolIds", async () => {
      const registry = new ToolRegistry();
      const roleManager = createRoleManager({
        implementer: ["read_file", "write_file", "task:complete"],
      });

      const tools = await registry.getToolsForRoleId("implementer", roleManager);
      const toolNames = tools.map((tool) => tool.name);

      expect(toolNames).toHaveLength(3);
      expect(toolNames).toEqual(
        expect.arrayContaining(["read_file", "write_file", "task:complete"])
      );
    });

    it("returns empty array when role is not found", async () => {
      const registry = new ToolRegistry();
      const roleManager = createRoleManager({});

      const tools = await registry.getToolsForRoleId("unknown", roleManager);
      expect(tools).toEqual([]);
    });
  });

  describe("getToolsForStageWithRoleId", () => {
    it("filters by stage after role filtering", async () => {
      const registry = new ToolRegistry();
      const roleManager = createRoleManager({
        reviewer: ["read_file", "task:approve", "task:list", "task:status"],
      });

      const tools = await registry.getToolsForStageWithRoleId(
        "reviewer",
        roleManager,
        "review"
      );

      expect(tools.map((t) => t.name)).toEqual(
        expect.arrayContaining(["read_file", "task:approve"])
      );
      expect(tools.map((t) => t.name)).toContain("task:status");
    });
  });

  describe("getProviderToolsForRoleId", () => {
    it("returns provider tools for role IDs without extra fields", async () => {
      const registry = new ToolRegistry();
      const roleManager = createRoleManager({
        researcher: ["read_file", "list_files"],
      });

      const providerTools = await registry.getProviderToolsForRoleId(
        "researcher",
        roleManager
      );

      expect(providerTools).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "read_file" }),
          expect.objectContaining({ name: "list_files" }),
        ])
      );

      for (const tool of providerTools) {
        expect(tool).not.toHaveProperty("allowedRoles");
      }
    });
  });

  describe("getProviderToolsForStageWithRoleId", () => {
    it("applies stage filtering for provider tools", async () => {
      const registry = new ToolRegistry();
      const roleManager = createRoleManager({
        controller: ["task:approve", "task:start", "chain:status"],
      });

      const providerTools = await registry.getProviderToolsForStageWithRoleId(
        "controller",
        roleManager,
        "review"
      );

      expect(providerTools.map((t) => t.name)).toContain("task:approve");
      expect(providerTools.map((t) => t.name)).not.toContain("task:start");
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
        category: "task",
        mutates: false,
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
      const EXPECTED_TOTAL_TOOL_COUNT = 26;
      expect(allTools).toHaveLength(EXPECTED_TOTAL_TOOL_COUNT);
    });
  });
});

describe("Tool definitions", () => {
  describe("chainStatusTool", () => {
    it("has correct structure", () => {
      expect(chainStatusTool.name).toBe("chain:status");
      expect(chainStatusTool.parameters.required).toContain("chainId");
    });
  });

  describe("taskStatusTool", () => {
    it("has required parameters", () => {
      expect(taskStatusTool.parameters.required).toContain("chainId");
      expect(taskStatusTool.parameters.required).toContain("taskId");
    });
  });

  describe("taskListTool", () => {
    it("has optional status filter", () => {
      expect(taskListTool.parameters.properties.status).toBeDefined();
      expect(taskListTool.parameters.required).not.toContain("status");
    });
  });

  describe("taskStartTool", () => {
    it("defines required ids", () => {
      expect(taskStartTool.parameters.required).toEqual(
        expect.arrayContaining(["chainId", "taskId"])
      );
    });
  });

  describe("taskCompleteTool", () => {
    it("has optional summary parameter", () => {
      expect(taskCompleteTool.parameters.properties.summary).toBeDefined();
      expect(taskCompleteTool.parameters.required).not.toContain("summary");
    });
  });

  describe("taskApproveTool", () => {
    it("requires chainId and taskId", () => {
      expect(taskApproveTool.parameters.required).toEqual(
        expect.arrayContaining(["chainId", "taskId"])
      );
    });
  });

  describe("spawnImplSessionTool", () => {
    it("has optional context parameter", () => {
      expect(spawnImplSessionTool.parameters.properties.context).toBeDefined();
      expect(spawnImplSessionTool.parameters.required).not.toContain("context");
    });
  });

  describe("readFileTool", () => {
    it("requires path parameter", () => {
      expect(readFileTool.parameters.required).toContain("path");
    });

    it("has optional offset and limit parameters", () => {
      expect(readFileTool.parameters.properties.offset).toBeDefined();
      expect(readFileTool.parameters.properties.limit).toBeDefined();
      expect(readFileTool.parameters.required).not.toContain("offset");
      expect(readFileTool.parameters.required).not.toContain("limit");
    });
  });

  describe("writeFileTool", () => {
    it("requires path and content parameters", () => {
      expect(writeFileTool.parameters.required).toContain("path");
      expect(writeFileTool.parameters.required).toContain("content");
    });

    it("has optional createOnly parameter", () => {
      expect(writeFileTool.parameters.properties.createOnly).toBeDefined();
      expect(writeFileTool.parameters.required).not.toContain("createOnly");
    });
  });

  describe("listFilesTool", () => {
    it("requires path parameter", () => {
      expect(listFilesTool.parameters.required).toContain("path");
    });

    it("has optional pattern and recursive parameters", () => {
      expect(listFilesTool.parameters.properties.pattern).toBeDefined();
      expect(listFilesTool.parameters.properties.recursive).toBeDefined();
      expect(listFilesTool.parameters.required).not.toContain("pattern");
      expect(listFilesTool.parameters.required).not.toContain("recursive");
    });
  });

  describe("searchFilesTool", () => {
    it("requires query parameter", () => {
      expect(searchFilesTool.parameters.required).toContain("query");
    });

    it("has optional path, include, and exclude parameters", () => {
      expect(searchFilesTool.parameters.properties.path).toBeDefined();
      expect(searchFilesTool.parameters.properties.include).toBeDefined();
      expect(searchFilesTool.parameters.properties.exclude).toBeDefined();
      expect(searchFilesTool.parameters.required).not.toContain("path");
      expect(searchFilesTool.parameters.required).not.toContain("include");
      expect(searchFilesTool.parameters.required).not.toContain("exclude");
    });
  });
});

describe("toProviderTool", () => {
  it("returns provider shape without governance metadata", () => {
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
    expect(toolNames).toContain("read_file");
    expect(toolNames).toContain("write_file");
    expect(toolNames).toContain("list_files");
    expect(toolNames).toContain("search_files");
  });
});
