// ADR: ADR-010-agent-runtime-architecture

/**
 * Tool registry with role-based filtering.
 * Provides tools to agents based on their role (control or impl).
 */

import type { ToolDefinition } from "./types.js";
import { toProviderTool } from "./types.js";
import type { Tool } from "../providers/types.js";
import type { RoleManager, StageType } from "@choragen/core";
import { isToolAllowedForStage } from "@choragen/core";

// Import all tool definitions
import { chainStatusTool } from "./definitions/chain-status.js";
import { taskStatusTool } from "./definitions/task-status.js";
import { taskListTool } from "./definitions/task-list.js";
import { taskStartTool } from "./definitions/task-start.js";
import { taskCompleteTool } from "./definitions/task-complete.js";
import { taskApproveTool } from "./definitions/task-approve.js";
import { spawnImplSessionTool } from "./definitions/spawn-impl-session.js";
import { readFileTool } from "./definitions/read-file.js";
import { writeFileTool } from "./definitions/write-file.js";
import { listFilesTool } from "./definitions/list-files.js";
import { searchFilesTool } from "./definitions/search-files.js";

/**
 * All registered tools for Phase 1.
 */
const ALL_TOOLS: ToolDefinition[] = [
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
];

/**
 * Registry for managing tools with role-based access control.
 */
export class ToolRegistry {
  private tools: ToolDefinition[];

  /**
   * Create a new ToolRegistry.
   * @param tools - Tools to register (defaults to all Phase 1 tools)
   */
  constructor(tools: ToolDefinition[] = ALL_TOOLS) {
    this.tools = [...tools];
  }

  /**
   * Get all registered tools.
   */
  getAllTools(): ToolDefinition[] {
    return [...this.tools];
  }

  /**
   * Get tools available for a dynamic role ID using RoleManager.
   * @param roleId - Role identifier managed by RoleManager
   * @param roleManager - Role manager instance for lookups
   * @returns Tools that the resolved role is allowed to use
   */
  async getToolsForRoleId(
    roleId: string,
    roleManager: RoleManager
  ): Promise<ToolDefinition[]> {
    const role = await roleManager.get(roleId);
    if (!role) return [];

    const allowedToolNames = new Set(role.toolIds);
    return this.tools.filter((tool) => allowedToolNames.has(tool.name));
  }

  /**
   * Get tools in provider format for a dynamic role ID.
   * @param roleId - Role identifier managed by RoleManager
   * @param roleManager - Role manager instance for lookups
   * @returns Tools in provider format that the resolved role is allowed to use
   */
  async getProviderToolsForRoleId(
    roleId: string,
    roleManager: RoleManager
  ): Promise<Tool[]> {
    const tools = await this.getToolsForRoleId(roleId, roleManager);
    return tools.map(toProviderTool);
  }

  /**
   * Get tools available for a dynamic role ID and workflow stage.
   * Stage filtering is additive to role-based filtering. If stageType is null/undefined,
   * only role-based filtering is applied.
   */
  async getToolsForStageWithRoleId(
    roleId: string,
    roleManager: RoleManager,
    stageType?: StageType | null
  ): Promise<ToolDefinition[]> {
    const roleTools = await this.getToolsForRoleId(roleId, roleManager);
    if (!stageType) return roleTools;
    return roleTools.filter((tool) => isToolAllowedForStage(stageType, tool.name));
  }

  /**
   * Get tools in provider format for a dynamic role ID and workflow stage.
   * If stageType is null/undefined, only role filtering is applied.
   */
  async getProviderToolsForStageWithRoleId(
    roleId: string,
    roleManager: RoleManager,
    stageType?: StageType | null
  ): Promise<Tool[]> {
    const tools = await this.getToolsForStageWithRoleId(roleId, roleManager, stageType);
    return tools.map(toProviderTool);
  }

  /**
   * Get a tool by name.
   * @param name - Tool name
   * @returns Tool definition or undefined if not found
   */
  getTool(name: string): ToolDefinition | undefined {
    return this.tools.find((tool) => tool.name === name);
  }

  /**
   * Register a new tool.
   * @param tool - Tool definition to register
   */
  registerTool(tool: ToolDefinition): void {
    // Remove existing tool with same name if present
    this.tools = this.tools.filter((t) => t.name !== tool.name);
    this.tools.push(tool);
  }
}

/**
 * Default tool registry instance with all Phase 1 tools.
 */
export const defaultRegistry = new ToolRegistry();
