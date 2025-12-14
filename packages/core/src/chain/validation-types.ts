/**
 * Chain completion validation types
 *
 * Defines the checks and result shapes used by the chain completion gate.
 *
 * ADR: ADR-001-task-file-format
 */

/** All validation checks that can run for a chain completion gate */
export type ChainValidationCheck =
  | "task_state"
  | "completion_notes"
  | "acceptance_criteria"
  | "design_doc_updates"
  | "test_coverage";

/** All valid validation check values */
export const CHAIN_VALIDATION_CHECKS: readonly ChainValidationCheck[] = [
  "task_state",
  "completion_notes",
  "acceptance_criteria",
  "design_doc_updates",
  "test_coverage",
] as const;

/** Base shape for a validation result */
export interface ChainValidationResult {
  /** Which check produced this result */
  check: ChainValidationCheck;
  /** Whether the check passed */
  success: boolean;
  /** Actionable feedback or reasons when a check fails */
  feedback?: string[];
}

/** Validation success result (feedback is optional) */
export interface ChainValidationSuccess extends ChainValidationResult {
  success: true;
  feedback?: string[];
}

/** Validation failure result (feedback should explain why it failed) */
export interface ChainValidationFailure extends ChainValidationResult {
  success: false;
  feedback: string[];
}

/** Discriminated union for validation outcomes */
export type ChainValidationOutcome = ChainValidationSuccess | ChainValidationFailure;

/** Configuration for chain completion validation */
export interface ChainValidationConfig {
  /** Checks applied to all chains unless overridden */
  defaultChecks?: ChainValidationCheck[];
  /** Chain-specific overrides of the checks to run */
  chainOverrides?: Record<string, ChainValidationCheck[]>;
  /** Checks that must pass before the gate is satisfied */
  requiredChecks?: ChainValidationCheck[];
  /** File globs that count as design documentation for update checks */
  designDocGlobs?: string[];
  /** File globs that count as tests for coverage checks */
  testFileGlobs?: string[];
}

/** Aggregate result for a chain completion gate */
export interface ChainCompletionGateResult {
  /** Chain ID the validation ran against */
  chainId: string;
  /** Whether all required checks passed */
  valid: boolean;
  /** Detailed results for each check */
  results: ChainValidationOutcome[];
  /** Checks that failed (subset of results) */
  failedChecks?: ChainValidationCheck[];
}
