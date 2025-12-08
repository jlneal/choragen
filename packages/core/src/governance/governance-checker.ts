/**
 * Governance checker
 *
 * Checks file mutations against governance rules.
 *
 * ADR: ADR-002-governance-schema
 */

import type {
  GovernanceSchema,
  MutationAction,
  MutationCheckResult,
  GovernanceCheckSummary,
  MutationRule,
  AgentRole,
} from "./types.js";
import { matchGlob } from "../utils/index.js";

/**
 * Check a single file mutation against governance rules
 */
export function checkMutation(
  schema: GovernanceSchema,
  file: string,
  action: MutationAction
): MutationCheckResult {
  // Check deny rules first (highest priority)
  for (const rule of schema.mutations.deny) {
    if (matchGlob(rule.pattern, file) && rule.actions.includes(action)) {
      return {
        file,
        action,
        policy: "deny",
        reason: rule.reason,
        matchedRule: rule,
      };
    }
  }

  // Check approve rules next
  for (const rule of schema.mutations.approve) {
    if (matchGlob(rule.pattern, file) && rule.actions.includes(action)) {
      return {
        file,
        action,
        policy: "approve",
        reason: rule.reason,
        matchedRule: rule,
      };
    }
  }

  // Check allow rules
  for (const rule of schema.mutations.allow) {
    if (matchGlob(rule.pattern, file) && rule.actions.includes(action)) {
      return {
        file,
        action,
        policy: "allow",
        matchedRule: rule,
      };
    }
  }

  // Default: deny if no rule matches
  return {
    file,
    action,
    policy: "deny",
    reason: "No matching governance rule",
  };
}

/**
 * Check multiple file mutations
 */
export function checkMutations(
  schema: GovernanceSchema,
  mutations: Array<{ file: string; action: MutationAction }>
): GovernanceCheckSummary {
  const results = mutations.map(({ file, action }) =>
    checkMutation(schema, file, action)
  );

  const allowed = results.filter((r) => r.policy === "allow");
  const needsApproval = results.filter((r) => r.policy === "approve");
  const denied = results.filter((r) => r.policy === "deny");

  return {
    files: results,
    allowed,
    needsApproval,
    denied,
    allAllowed: denied.length === 0 && needsApproval.length === 0,
    hasDenied: denied.length > 0,
    hasApprovalRequired: needsApproval.length > 0,
  };
}

/**
 * Format a governance check summary for display
 */
export function formatCheckSummary(summary: GovernanceCheckSummary): string {
  const lines: string[] = [];

  if (summary.allAllowed) {
    lines.push("✓ All mutations allowed");
    return lines.join("\n");
  }

  if (summary.denied.length > 0) {
    lines.push("✗ Denied mutations:");
    for (const result of summary.denied) {
      lines.push(`  - ${result.file} (${result.action})`);
      if (result.reason) {
        lines.push(`    Reason: ${result.reason}`);
      }
    }
    lines.push("");
  }

  if (summary.needsApproval.length > 0) {
    lines.push("⚠ Mutations requiring approval:");
    for (const result of summary.needsApproval) {
      lines.push(`  - ${result.file} (${result.action})`);
      if (result.reason) {
        lines.push(`    Reason: ${result.reason}`);
      }
    }
    lines.push("");
  }

  if (summary.allowed.length > 0) {
    lines.push(`✓ ${summary.allowed.length} mutation(s) allowed`);
  }

  return lines.join("\n");
}

/**
 * Governance checker class for stateful checking
 */
export class GovernanceChecker {
  private schema: GovernanceSchema;

  constructor(schema: GovernanceSchema) {
    this.schema = schema;
  }

  /**
   * Check a single mutation
   */
  check(file: string, action: MutationAction): MutationCheckResult {
    return checkMutation(this.schema, file, action);
  }

  /**
   * Check multiple mutations
   */
  checkAll(
    mutations: Array<{ file: string; action: MutationAction }>
  ): GovernanceCheckSummary {
    return checkMutations(this.schema, mutations);
  }

  /**
   * Check if a file can be created
   */
  canCreate(file: string): MutationCheckResult {
    return this.check(file, "create");
  }

  /**
   * Check if a file can be modified
   */
  canModify(file: string): MutationCheckResult {
    return this.check(file, "modify");
  }

  /**
   * Check if a file can be deleted
   */
  canDelete(file: string): MutationCheckResult {
    return this.check(file, "delete");
  }

  /**
   * Get all rules that match a file
   */
  getMatchingRules(file: string): MutationRule[] {
    const rules: MutationRule[] = [];

    for (const rule of this.schema.mutations.deny) {
      if (matchGlob(rule.pattern, file)) {
        rules.push(rule);
      }
    }
    for (const rule of this.schema.mutations.approve) {
      if (matchGlob(rule.pattern, file)) {
        rules.push(rule);
      }
    }
    for (const rule of this.schema.mutations.allow) {
      if (matchGlob(rule.pattern, file)) {
        rules.push(rule);
      }
    }

    return rules;
  }
}

/**
 * Check a file mutation against role-specific governance rules.
 *
 * Role-based governance follows this logic:
 * 1. If no roles section exists, fall back to global mutations check
 * 2. If role has no rules defined, deny by default
 * 3. Check deny rules first (highest priority)
 * 4. Check allow rules
 * 5. If no rule matches, deny
 */
export function checkMutationForRole(
  file: string,
  action: MutationAction,
  role: AgentRole,
  schema: GovernanceSchema
): MutationCheckResult {
  // If no roles section, fall back to global mutations check
  if (!schema.roles) {
    return checkMutation(schema, file, action);
  }

  const roleRules = schema.roles[role];

  // If role has no rules defined, deny by default
  if (!roleRules) {
    return {
      file,
      action,
      policy: "deny",
      reason: `No governance rules defined for role: ${role}`,
    };
  }

  // Check deny rules first (highest priority)
  for (const rule of roleRules.deny) {
    if (matchGlob(rule.pattern, file) && rule.actions.includes(action)) {
      return {
        file,
        action,
        policy: "deny",
        reason: rule.reason ?? `Denied by role ${role} governance`,
        matchedRule: rule,
      };
    }
  }

  // Check allow rules
  for (const rule of roleRules.allow) {
    if (matchGlob(rule.pattern, file) && rule.actions.includes(action)) {
      return {
        file,
        action,
        policy: "allow",
        matchedRule: rule,
      };
    }
  }

  // Default: deny if no rule matches
  return {
    file,
    action,
    policy: "deny",
    reason: `No matching role governance rule for ${role}`,
  };
}
