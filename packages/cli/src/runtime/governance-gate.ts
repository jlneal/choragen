// ADR: ADR-010-agent-runtime-architecture

/**
 * Governance gate for validating tool calls before execution.
 * Phase 1: Role-based validation only.
 * Phase 3 will add file path validation and lock checking.
 */

import type { AgentRole } from "./tools/types.js";
import { ToolRegistry, defaultRegistry } from "./tools/registry.js";

/**
 * Represents a tool call to be validated.
 */
export interface ToolCall {
  /** Tool name (e.g., "task:approve", "chain:status") */
  name: string;
  /** Tool parameters */
  params: Record<string, unknown>;
}

/**
 * Result of governance validation.
 */
export interface ValidationResult {
  /** Whether the tool call is allowed */
  allowed: boolean;
  /** Reason for denial (only present when allowed is false) */
  reason?: string;
}

/**
 * Governance gate that validates tool calls before execution.
 * Enforces role-based access control for tools.
 */
export class GovernanceGate {
  private registry: ToolRegistry;

  /**
   * Create a new GovernanceGate.
   * @param registry - Tool registry to use for validation (defaults to defaultRegistry)
   */
  constructor(registry: ToolRegistry = defaultRegistry) {
    this.registry = registry;
  }

  /**
   * Validate a tool call for a given role.
   * @param toolCall - The tool call to validate
   * @param role - The agent role attempting the call
   * @returns Validation result indicating if the call is allowed
   */
  validate(toolCall: ToolCall, role: AgentRole): ValidationResult {
    const { name } = toolCall;

    // Check if tool exists
    const tool = this.registry.getTool(name);
    if (!tool) {
      return {
        allowed: false,
        reason: `Unknown tool: ${name}`,
      };
    }

    // Check if role can use this tool
    if (!this.registry.canRoleUseTool(role, name)) {
      return {
        allowed: false,
        reason: `Tool ${name} is not available to ${role} role`,
      };
    }

    // Phase 1: Role-based validation passed
    return { allowed: true };
  }

  /**
   * Validate multiple tool calls at once.
   * @param toolCalls - Array of tool calls to validate
   * @param role - The agent role attempting the calls
   * @returns Array of validation results in the same order
   */
  validateBatch(toolCalls: ToolCall[], role: AgentRole): ValidationResult[] {
    return toolCalls.map((call) => this.validate(call, role));
  }

  /**
   * Check if all tool calls in a batch are allowed.
   * @param toolCalls - Array of tool calls to validate
   * @param role - The agent role attempting the calls
   * @returns True if all calls are allowed, false otherwise
   */
  allAllowed(toolCalls: ToolCall[], role: AgentRole): boolean {
    return toolCalls.every((call) => this.validate(call, role).allowed);
  }
}

/**
 * Default governance gate instance using the default tool registry.
 */
export const defaultGovernanceGate = new GovernanceGate();
