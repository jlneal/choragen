/**
 * Governance type definitions
 */

export type MutationAction = "create" | "modify" | "delete";
export type MutationPolicy = "allow" | "approve" | "deny";

export interface MutationRule {
  /** Glob pattern for matching files */
  pattern: string;
  /** Actions this rule applies to (default: all) */
  actions: MutationAction[];
  /** Optional reason for approve/deny rules */
  reason?: string;
}

export interface CollisionConfig {
  /** How to detect collisions */
  strategy: "file-lock" | "directory-lock";
  /** What to do on collision */
  onCollision: "block" | "warn";
}

export interface GovernanceSchema {
  mutations: {
    allow: MutationRule[];
    approve: MutationRule[];
    deny: MutationRule[];
  };
  collisionDetection?: CollisionConfig;
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

export interface GovernanceCheckSummary {
  /** All files checked */
  files: MutationCheckResult[];
  /** Files that are allowed */
  allowed: MutationCheckResult[];
  /** Files that need approval */
  needsApproval: MutationCheckResult[];
  /** Files that are denied */
  denied: MutationCheckResult[];
  /** Whether all mutations are allowed (no denies, no approvals needed) */
  allAllowed: boolean;
  /** Whether any mutations are denied */
  hasDenied: boolean;
  /** Whether any mutations need approval */
  hasApprovalRequired: boolean;
}

/** Default governance schema (permissive) */
export const DEFAULT_GOVERNANCE_SCHEMA: GovernanceSchema = {
  mutations: {
    allow: [{ pattern: "**/*", actions: ["create", "modify", "delete"] }],
    approve: [],
    deny: [],
  },
};
