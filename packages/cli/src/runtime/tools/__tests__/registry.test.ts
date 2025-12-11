/**
 * @design-doc docs/design/core/features/workflow-orchestration.md
 * @user-intent "Ensure tool registry applies role filtering and optional stage-scoped filtering"
 * @test-type unit
 */

import { describe, it, expect } from "vitest";
import { ToolRegistry } from "../registry.js";
import { writeFileTool } from "../definitions/write-file.js";
import { readFileTool } from "../definitions/read-file.js";
import { chainStatusTool } from "../definitions/chain-status.js";
import { taskApproveTool } from "../definitions/task-approve.js";
import { taskStartTool } from "../definitions/task-start.js";
import type { ToolDefinition } from "../types.js";
import type { StageType } from "@choragen/core";

function registryWithTools(tools: ToolDefinition[]): ToolRegistry {
  return new ToolRegistry(tools);
}

describe("ToolRegistry stage-scoped filtering", () => {
  it("returns role-filtered tools when no stage is provided", () => {
    const registry = registryWithTools([writeFileTool, readFileTool]);

    const implTools = registry.getToolsForStage("impl", null);

    expect(implTools.map((t) => t.name)).toContain("write_file");
    expect(implTools.map((t) => t.name)).toContain("read_file");
  });

  it("filters tools by stage in addition to role", () => {
    const registry = registryWithTools([writeFileTool, readFileTool, chainStatusTool]);

    const requestTools = registry.getToolsForStage("impl", "request");

    expect(requestTools.map((t) => t.name)).toContain("read_file");
    expect(requestTools.map((t) => t.name)).toContain("chain:status");
    expect(requestTools.map((t) => t.name)).not.toContain("write_file");
  });

  it("allows stage-appropriate tools for implementation stage", () => {
    const registry = registryWithTools([writeFileTool, taskStartTool, readFileTool]);

    const implStageTools = registry.getToolsForStage("impl", "implementation");

    expect(implStageTools.map((t) => t.name)).toEqual(expect.arrayContaining(["write_file", "read_file"]));
    expect(implStageTools.map((t) => t.name)).not.toContain("task:start"); // filtered by role
  });

  it("respects review stage matrix for control role", () => {
    const registry = registryWithTools([taskApproveTool, chainStatusTool, taskStartTool]);

    const reviewTools = registry.getToolsForStage("control", "review");

    expect(reviewTools.map((t) => t.name)).toContain("task:approve");
    expect(reviewTools.map((t) => t.name)).toContain("chain:status");
    expect(reviewTools.map((t) => t.name)).not.toContain("task:start");
  });

  it("returns empty array when no tools are allowed for the role", () => {
    const registry = registryWithTools([writeFileTool]);

    const controlTools = registry.getToolsForStage("control", "implementation" as StageType);

    expect(controlTools).toHaveLength(0);
  });
});
