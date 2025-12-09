// ADR: ADR-010-agent-runtime-architecture

import { minimatch } from "minimatch";
import { LockManager } from "@choragen/core";

/**
 * Governance gate for validating tool calls before execution.
 * Phase 1: Role-based validation only.
 * Phase 3: File path validation for write operations.
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
 * Result of lock checking.
 */
export interface LockCheckResult {
  /** Whether the file is available (not locked by another chain) */
  available: boolean;
  /** Chain ID that holds the lock (only present when available is false) */
  lockedBy?: string;
}

/**
 * Governance gate that validates tool calls before execution.
 * Enforces role-based access control for tools.
 */
export class GovernanceGate {
  private registry: ToolRegistry;
  private lockManager: LockManager | null;

  /**
   * Create a new GovernanceGate.
   * @param registry - Tool registry to use for validation (defaults to defaultRegistry)
   * @param lockManager - Lock manager for file lock checking (optional)
   */
  constructor(
    registry: ToolRegistry = defaultRegistry,
    lockManager: LockManager | null = null
  ) {
    this.registry = registry;
    this.lockManager = lockManager;
  }

  /**
   * Validate a tool call for a given role (synchronous, no lock checking).
   * Use validateAsync for full validation including lock checking.
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

    // Phase 3: File path validation for write_file
    if (toolCall.name === "write_file") {
      const filePath = toolCall.params.path as string | undefined;
      if (filePath) {
        const fileValidation = this.validateFilePath(filePath, role, "modify");
        if (!fileValidation.allowed) {
          return fileValidation;
        }
      }
    }

    return { allowed: true };
  }

  /**
   * Validate a tool call for a given role with full async validation including lock checking.
   * @param toolCall - The tool call to validate
   * @param role - The agent role attempting the call
   * @param chainId - The current chain ID (optional, used for lock checking)
   * @returns Validation result indicating if the call is allowed
   */
  async validateAsync(
    toolCall: ToolCall,
    role: AgentRole,
    chainId?: string
  ): Promise<ValidationResult> {
    // First, run synchronous validation
    const syncResult = this.validate(toolCall, role);
    if (!syncResult.allowed) {
      return syncResult;
    }

    // Phase 4: Lock checking for write_file
    if (toolCall.name === "write_file" && this.lockManager) {
      const filePath = toolCall.params.path as string | undefined;
      if (filePath) {
        const lockResult = await this.checkLocks(filePath, chainId);
        if (!lockResult.available) {
          return {
            allowed: false,
            reason: `File ${filePath} is locked by chain ${lockResult.lockedBy}`,
          };
        }
      }
    }

    return { allowed: true };
  }

  /**
   * Check if a file is locked by another chain.
   * @param filePath - The file path to check
   * @param chainId - The current chain ID (files locked by this chain are allowed)
   * @returns Lock check result indicating if the file is available
   */
  async checkLocks(filePath: string, chainId?: string): Promise<LockCheckResult> {
    if (!this.lockManager) {
      return { available: true };
    }

    const lockStatus = await this.lockManager.isFileLocked(filePath);

    if (lockStatus.locked && lockStatus.chainId !== chainId) {
      return {
        available: false,
        lockedBy: lockStatus.chainId,
      };
    }

    return { available: true };
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

  /**
   * Validate a file path against role-based governance rules.
   * @param filePath - The file path to validate (relative or absolute)
   * @param role - The agent role attempting the operation
   * @param action - The action being performed (create, modify, delete)
   * @returns Validation result indicating if the operation is allowed
   */
  validateFilePath(
    filePath: string,
    role: AgentRole,
    action: "create" | "modify" | "delete"
  ): ValidationResult {
    // Normalize path: remove leading slash for consistent matching
    const normalizedPath = filePath.startsWith("/")
      ? filePath.slice(1)
      : filePath;

    // Get rules for the role
    const rules = FILE_PATH_RULES[role];

    // Check denied patterns first (deny takes precedence)
    for (const pattern of rules.denied) {
      if (minimatch(normalizedPath, pattern)) {
        return {
          allowed: false,
          reason: `Role ${role} cannot ${action} ${filePath} - matches denied pattern ${pattern}`,
        };
      }
    }

    // Check if path matches any allowed pattern
    const isAllowed = rules.allowed.some((pattern) =>
      minimatch(normalizedPath, pattern)
    );

    if (!isAllowed) {
      return {
        allowed: false,
        reason: `Role ${role} cannot ${action} ${filePath} - does not match any allowed pattern`,
      };
    }

    return { allowed: true };
  }
}

/**
 * File path governance rules by role.
 * Based on AGENTS.md role boundaries.
 */
interface FilePathRules {
  allowed: string[];
  denied: string[];
}

const FILE_PATH_RULES: Record<AgentRole, FilePathRules> = {
  impl: {
    allowed: [
      "packages/**/src/**/*.ts",
      "packages/**/__tests__/**/*.ts",
      "packages/**/src/**/*.json",
      "*.config.*",
      "**/README.md",
    ],
    denied: [
      "docs/tasks/**",
      "docs/requests/**",
      "docs/adr/**",
    ],
  },
  control: {
    allowed: [
      "docs/**/*.md",
      "docs/tasks/**",
      "docs/requests/**",
      "docs/adr/**",
      "AGENTS.md",
      "**/AGENTS.md",
    ],
    denied: [
      "packages/**/src/**/*.ts",
      "packages/**/__tests__/**/*.ts",
    ],
  },
};

/**
 * Default governance gate instance using the default tool registry.
 */
export const defaultGovernanceGate = new GovernanceGate();
