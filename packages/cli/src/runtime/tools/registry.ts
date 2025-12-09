// ADR: ADR-010-agent-runtime-architecture

/**
 * Tool registry with role-based filtering.
 * Provides tools to agents based on their role (control or impl).
 */

import type { AgentRole, ToolDefinition } from "./types.js";
import { toProviderTool } from "./types.js";
import type { Tool } from "../providers/types.js";

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
   * Get tools available for a specific role.
   * @param role - Agent role ("control" or "impl")
   * @returns Tools that the role is allowed to use
   */
  getToolsForRole(role: AgentRole): ToolDefinition[] {
    return this.tools.filter((tool) => tool.allowedRoles.includes(role));
  }

  /**
   * Get tools in provider format for a specific role.
   * Strips role information for LLM consumption.
   * @param role - Agent role ("control" or "impl")
   * @returns Tools in the format expected by LLM providers
   */
  getProviderToolsForRole(role: AgentRole): Tool[] {
    return this.getToolsForRole(role).map(toProviderTool);
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
   * Check if a role can use a specific tool.
   * @param role - Agent role
   * @param toolName - Tool name
   * @returns True if the role can use the tool
   */
  canRoleUseTool(role: AgentRole, toolName: string): boolean {
    const tool = this.getTool(toolName);
    return tool !== undefined && tool.allowedRoles.includes(role);
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
