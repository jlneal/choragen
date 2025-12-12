// ADR: ADR-010-agent-runtime-architecture

/**
 * Tool type definitions for the agent runtime.
 * Tools are filtered by agent role to enforce governance boundaries.
 */

import type { ToolParameterSchema } from "../providers/types.js";

/**
 * Agent role determines which tools are available.
 * @deprecated Use dynamic role IDs via RoleManager instead of hardcoded roles.
 */
export type AgentRole = "control" | "impl";

/**
 * Tool definition with role-based access control.
 */
export interface ToolDefinition {
  /**
   * Tool name (e.g., "chain:status", "task:complete").
   */
  name: string;

  /**
   * Human-readable description of what the tool does.
   */
  description: string;

  /**
   * JSON Schema for tool parameters.
   */
  parameters: ToolParameterSchema;

  /**
   * Category for UI grouping (e.g., filesystem, task).
   */
  category: string;

  /**
   * Whether the tool can modify state.
   */
  mutates: boolean;
}

/**
 * Convert a ToolDefinition to the provider Tool format.
 */
export function toProviderTool(
  definition: ToolDefinition
): { name: string; description: string; parameters: ToolParameterSchema } {
  return {
    name: definition.name,
    description: definition.description,
    parameters: definition.parameters,
  };
}
