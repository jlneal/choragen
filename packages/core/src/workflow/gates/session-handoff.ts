// ADR: ADR-001-task-file-format
// CR: CR-20251213-008-session-handoff-gate

/**
 * Session handoff gate
 *
 * Validates context preservation when control agent hands off to impl agent or vice versa.
 */

import type { Task, TaskConfig } from "../../tasks/types.js";
import { DEFAULT_TASK_CONFIG } from "../../tasks/types.js";
import type { StageGate } from "../types.js";
import {
  type HandoffAgentRole,
  type HandoffContext,
  type HandoffSuggestion,
  type HandoffValidationCheck,
  type SessionHandoffGateResult,
  HANDOFF_CONTEXT_TEMPLATE,
} from "./handoff-types.js";
import {
  runHandoffValidation,
  parseHandoffContext,
  type RunHandoffValidationOptions,
} from "./handoff-validation.js";

/** Session handoff gate extends StageGate with handoff-specific fields */
export interface SessionHandoffGate extends StageGate {
  type: "session_handoff";
  /** Role handing off */
  from?: HandoffAgentRole;
  /** Role receiving handoff */
  to?: HandoffAgentRole;
  /** Task being handed off */
  task?: Task;
  /** Chain ID for context */
  chainId?: string;
  /** Whether validation passed */
  validated?: boolean;
  /** Handoff context if validation passed */
  context?: HandoffContext;
}

/** Options for running the session handoff gate */
export interface SessionHandoffGateOptions {
  /** Project root for locating task files */
  projectRoot: string;
  /** Role handing off */
  from: HandoffAgentRole;
  /** Role receiving handoff */
  to: HandoffAgentRole;
  /** Task being handed off (optional) */
  task?: Task;
  /** Task file content (optional, skips file read if provided) */
  taskContent?: string;
  /** Chain ID for context */
  chainId?: string;
  /** Optional task config override */
  taskConfig?: Partial<TaskConfig>;
  /** File globs for task scope (used by uncommitted_work check) */
  taskScopeGlobs?: string[];
  /** Explicit list of modified files (skips git status when provided) */
  modifiedFiles?: string[];
  /** Checks to run (defaults to all) */
  checks?: HandoffValidationCheck[];
  /** Checks that must pass (defaults to all enabled checks) */
  requiredChecks?: HandoffValidationCheck[];
}

/**
 * Execute session handoff validation gate.
 *
 * Validates that context is properly preserved when handing off between agent roles.
 */
export async function runSessionHandoffGate(
  options: SessionHandoffGateOptions
): Promise<SessionHandoffGateResult> {
  const taskConfig: TaskConfig = { ...DEFAULT_TASK_CONFIG, ...(options.taskConfig || {}) };

  const validationOptions: RunHandoffValidationOptions = {
    projectRoot: options.projectRoot,
    taskConfig,
    from: options.from,
    to: options.to,
    task: options.task,
    taskContent: options.taskContent,
    chainId: options.chainId,
    taskScopeGlobs: options.taskScopeGlobs,
    modifiedFiles: options.modifiedFiles,
    defaultChecks: options.checks,
    requiredChecks: options.requiredChecks,
  };

  const validationResult = await runHandoffValidation(validationOptions);

  const suggestions = validationResult.valid
    ? undefined
    : generateSuggestions(validationResult.failedChecks || [], options);

  let context: HandoffContext | undefined;
  if (validationResult.valid && options.taskContent) {
    context = parseHandoffContext(options.taskContent) || undefined;
  }

  return {
    valid: validationResult.valid,
    results: validationResult.results,
    failedChecks: validationResult.failedChecks,
    suggestions,
    context,
  };
}

/**
 * Generate actionable suggestions for failed validation checks.
 */
function generateSuggestions(
  failedChecks: HandoffValidationCheck[],
  options: SessionHandoffGateOptions
): HandoffSuggestion[] {
  const suggestions: HandoffSuggestion[] = [];

  for (const check of failedChecks) {
    switch (check) {
      case "handoff_notes":
        suggestions.push({
          type: "missing_notes",
          message: "Add a Handoff Context section to the task file with current state",
          template: HANDOFF_CONTEXT_TEMPLATE
            .replace("{{session}}", new Date().toISOString())
            .replace("{{from}}", options.from)
            .replace("{{to}}", options.to)
            .replace("{{state}}", "[Describe current state]")
            .replace("{{whatDone}}", "- [List what was done]")
            .replace("{{whatNext}}", "- [List what needs to happen]")
            .replace("{{openQuestions}}", "- None"),
        });
        break;

      case "uncommitted_work":
        suggestions.push({
          type: "uncommitted_files",
          message: "Commit or stash uncommitted changes before handoff",
        });
        break;

      case "role_match":
        suggestions.push({
          type: "role_mismatch",
          message: `Handoff from ${options.from} to ${options.to} may not be appropriate for this task type`,
        });
        break;

      case "blocking_feedback":
        suggestions.push({
          type: "blocking_items",
          message: "Resolve blocking feedback items before handoff",
        });
        break;

      case "task_format":
        suggestions.push({
          type: "missing_notes",
          message: "Task file is missing required sections (Description, Acceptance Criteria)",
        });
        break;
    }
  }

  return suggestions;
}

/**
 * Create a SessionHandoffGate object for use in workflow stage definitions.
 */
export function createSessionHandoffGate(
  from: HandoffAgentRole,
  to: HandoffAgentRole,
  task?: Task,
  chainId?: string
): SessionHandoffGate {
  return {
    type: "session_handoff",
    from,
    to,
    task,
    chainId,
    validated: false,
    satisfied: false,
  };
}

/**
 * Update a SessionHandoffGate with validation results.
 */
export function updateSessionHandoffGate(
  gate: SessionHandoffGate,
  result: SessionHandoffGateResult
): SessionHandoffGate {
  return {
    ...gate,
    validated: result.valid,
    context: result.context,
  };
}
