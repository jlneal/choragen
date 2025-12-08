// ADR: ADR-010-agent-runtime-architecture

/**
 * Tool type definitions for the agent runtime.
 * Tools are filtered by agent role to enforce governance boundaries.
 */

import type { ToolParameterSchema } from "../providers/types.js";

/**
 * Agent role determines which tools are available.
 */
export type AgentRole = "control" | "impl";

/**
 * Tool definition with role-based access control.
 * Extends the base Tool type with allowed roles.
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
   * Roles that are allowed to use this tool.
   */
  allowedRoles: AgentRole[];
}

/**
 * Convert a ToolDefinition to the provider Tool format.
 * Strips the allowedRoles field for LLM consumption.
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
