// ADR: ADR-001-task-file-format
// CR: CR-20251213-008-session-handoff-gate

/**
 * Session handoff validation types
 *
 * Defines the checks and result shapes used by the session handoff gate.
 */

/** Agent role types for handoff validation */
export type HandoffAgentRole = "control" | "impl" | "review" | "design" | "orchestration";

/** All validation checks that can run for a session handoff gate */
export type HandoffValidationCheck =
  | "task_format"
  | "uncommitted_work"
  | "handoff_notes"
  | "role_match"
  | "blocking_feedback";

/** All valid handoff validation check values */
export const HANDOFF_VALIDATION_CHECKS: readonly HandoffValidationCheck[] = [
  "task_format",
  "uncommitted_work",
  "handoff_notes",
  "role_match",
  "blocking_feedback",
] as const;

/** Handoff direction between agent roles */
export interface HandoffDirection {
  /** Role handing off */
  from: HandoffAgentRole;
  /** Role receiving handoff */
  to: HandoffAgentRole;
}

/** Context preserved during a session handoff */
export interface HandoffContext {
  /** ISO timestamp of the handoff */
  session: string;
  /** Role handing off */
  from: HandoffAgentRole;
  /** Role receiving handoff */
  to: HandoffAgentRole;
  /** Current state description */
  state: string;
  /** Summary of what was done in the session */
  whatDone: string[];
  /** What needs to happen next */
  whatNext: string[];
  /** Any open questions or blockers */
  openQuestions?: string[];
}

/** Base shape for a handoff validation result */
export interface HandoffValidationResult {
  /** Which check produced this result */
  check: HandoffValidationCheck;
  /** Whether the check passed */
  success: boolean;
  /** Actionable feedback or reasons when a check fails */
  feedback?: string[];
}

/** Validation success result (feedback is optional) */
export interface HandoffValidationSuccess extends HandoffValidationResult {
  success: true;
  feedback?: string[];
}

/** Validation failure result (feedback should explain why it failed) */
export interface HandoffValidationFailure extends HandoffValidationResult {
  success: false;
  feedback: string[];
}

/** Discriminated union for validation outcomes */
export type HandoffValidationOutcome = HandoffValidationSuccess | HandoffValidationFailure;

/** Configuration for session handoff validation */
export interface HandoffValidationConfig {
  /** Checks applied to all handoffs unless overridden */
  defaultChecks?: HandoffValidationCheck[];
  /** Task-type-specific overrides of the checks to run */
  taskTypeOverrides?: Record<string, HandoffValidationCheck[]>;
  /** Checks that must pass before the gate is satisfied */
  requiredChecks?: HandoffValidationCheck[];
  /** File globs for task scope (used by uncommitted_work check) */
  taskScopeGlobs?: string[];
}

/** Suggestion for missing context items */
export interface HandoffSuggestion {
  /** Type of suggestion */
  type: "missing_notes" | "uncommitted_files" | "role_mismatch" | "blocking_items";
  /** Human-readable message */
  message: string;
  /** Template or example to help resolve */
  template?: string;
}

/** Aggregate result for a session handoff gate */
export interface SessionHandoffGateResult {
  /** Whether all required checks passed */
  valid: boolean;
  /** Detailed results for each check */
  results: HandoffValidationOutcome[];
  /** Checks that failed (subset of results) */
  failedChecks?: HandoffValidationCheck[];
  /** Suggestions for resolving failures */
  suggestions?: HandoffSuggestion[];
  /** The handoff context if validation passed */
  context?: HandoffContext;
}

/** Handoff context template for suggestion generation */
export const HANDOFF_CONTEXT_TEMPLATE = `## Handoff Context

**Session**: {{session}}
**From**: {{from}}
**To**: {{to}}
**State**: {{state}}

### What was done
{{whatDone}}

### What needs to happen
{{whatNext}}

### Open questions
{{openQuestions}}
`;
