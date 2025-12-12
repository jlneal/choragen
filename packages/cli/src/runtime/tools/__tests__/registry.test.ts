/**
 * @design-doc docs/design/core/features/workflow-orchestration.md
 * @user-intent "Ensure tool registry applies role filtering and optional stage-scoped filtering"
 * @test-type unit
 */

import { describe, it, expect, vi } from "vitest";
import { ToolRegistry } from "../registry.js";
import { writeFileTool } from "../definitions/write-file.js";
import { readFileTool } from "../definitions/read-file.js";
import { chainStatusTool } from "../definitions/chain-status.js";
import { taskApproveTool } from "../definitions/task-approve.js";
import { taskStartTool } from "../definitions/task-start.js";
import type { ToolDefinition } from "../types.js";
import type { RoleManager, StageType } from "@choragen/core";

function registryWithTools(tools: ToolDefinition[]): ToolRegistry {
  return new ToolRegistry(tools);
}

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

describe("ToolRegistry stage-scoped filtering", () => {
  it("returns role-filtered tools when no stage is provided", async () => {
    const registry = registryWithTools([writeFileTool, readFileTool]);
    const roleManager = createRoleManager(["write_file", "read_file"]);

    const implTools = await registry.getToolsForStageWithRoleId(
      "implementer",
      roleManager,
      null
    );

    expect(implTools.map((t) => t.name)).toContain("write_file");
    expect(implTools.map((t) => t.name)).toContain("read_file");
  });

  it("filters tools by stage in addition to role", async () => {
    const registry = registryWithTools([writeFileTool, readFileTool, chainStatusTool]);
    const roleManager = createRoleManager(["write_file", "read_file", "chain:status"]);

    const requestTools = await registry.getToolsForStageWithRoleId(
      "implementer",
      roleManager,
      "request"
    );

    expect(requestTools.map((t) => t.name)).toContain("read_file");
    expect(requestTools.map((t) => t.name)).toContain("chain:status");
    expect(requestTools.map((t) => t.name)).not.toContain("write_file");
  });

  it("allows stage-appropriate tools for implementation stage", async () => {
    const registry = registryWithTools([writeFileTool, taskStartTool, readFileTool]);
    const roleManager = createRoleManager(["write_file", "task:start", "read_file"]);

    const implStageTools = await registry.getToolsForStageWithRoleId(
      "implementer",
      roleManager,
      "implementation"
    );

    expect(implStageTools.map((t) => t.name)).toEqual(
      expect.arrayContaining(["write_file", "read_file", "task:start"])
    );
  });

  it("respects review stage matrix for control role", async () => {
    const registry = registryWithTools([taskApproveTool, chainStatusTool, taskStartTool]);
    const roleManager = createRoleManager([
      "task:approve",
      "chain:status",
      "task:start",
    ]);

    const reviewTools = await registry.getToolsForStageWithRoleId(
      "controller",
      roleManager,
      "review"
    );

    expect(reviewTools.map((t) => t.name)).toContain("task:approve");
    expect(reviewTools.map((t) => t.name)).toContain("chain:status");
    expect(reviewTools.map((t) => t.name)).not.toContain("task:start");
  });

  it("returns empty array when no tools are allowed for the role", async () => {
    const registry = registryWithTools([writeFileTool]);
    const roleManager = createRoleManager([]);

    const controlTools = await registry.getToolsForStageWithRoleId(
      "controller",
      roleManager,
      "implementation" as StageType
    );

    expect(controlTools).toHaveLength(0);
  });
});
