/**
 * Governance schema enforcement
 *
 * Defines rules for file mutations: allow, approve, deny.
 * Parsed from choragen.governance.yaml in consumer projects.
 */

export type MutationAction = "create" | "modify" | "delete";
export type MutationPolicy = "allow" | "approve" | "deny";

export interface MutationRule {
  /** Glob pattern for matching files */
  pattern: string;
  /** Actions this rule applies to */
  actions: MutationAction[];
  /** Optional reason for approve/deny rules */
  reason?: string;
}

export interface GovernanceSchema {
  mutations: {
    allow: MutationRule[];
    approve: MutationRule[];
    deny: MutationRule[];
  };
  collisionDetection?: {
    strategy: "file-lock" | "directory-lock";
    onCollision: "block" | "warn";
  };
}

export interface MutationCheckResult {
  /** The file being checked */
  file: string;
  /** The action being performed */
  action: MutationAction;
  /** The policy that applies */
  policy: MutationPolicy;
  /** Reason if approve/deny */
  reason?: string;
  /** The rule that matched */
  matchedRule?: MutationRule;
}

// Placeholder exports - implementation in Phase 2
export const GovernanceParser = {
  // TODO: Implement in CR-20251205-005
};

export const GovernanceChecker = {
  // TODO: Implement in CR-20251205-005
};
