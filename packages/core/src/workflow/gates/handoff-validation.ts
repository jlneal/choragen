// ADR: ADR-001-task-file-format
// CR: CR-20251213-008-session-handoff-gate

/**
 * Session handoff validation runner
 *
 * Executes configured validation checks for a session handoff and aggregates results.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Task, TaskConfig } from "../../tasks/types.js";
import { DEFAULT_TASK_CONFIG } from "../../tasks/types.js";
import { matchGlob } from "../../utils/index.js";
import {
  type HandoffAgentRole,
  type HandoffValidationCheck,
  type HandoffValidationOutcome,
  type HandoffValidationConfig,
  type HandoffContext,
  HANDOFF_VALIDATION_CHECKS,
} from "./handoff-types.js";

const execFileAsync = promisify(execFile);

/** Options for running handoff validation */
export interface RunHandoffValidationOptions extends HandoffValidationConfig {
  /** Repository root for locating task files (defaults to process.cwd) */
  projectRoot?: string;
  /** Optional task config override (tasksPath, etc.) */
  taskConfig?: Partial<TaskConfig>;
  /** Explicit list of modified files (skips git status when provided) */
  modifiedFiles?: string[];
  /** The handoff direction */
  from: HandoffAgentRole;
  to: HandoffAgentRole;
  /** Task being handed off (optional, for task-specific checks) */
  task?: Task;
  /** Task file content (optional, skips file read if provided) */
  taskContent?: string;
  /** Chain ID for context */
  chainId?: string;
}

type ValidationContext = {
  projectRoot: string;
  taskConfig: TaskConfig;
  modifiedFiles: string[];
  taskScopeGlobs: string[];
  from: HandoffAgentRole;
  to: HandoffAgentRole;
  task?: Task;
  taskContent?: string;
  chainId?: string;
};

/** Aggregate result from running handoff validation */
export interface RunHandoffValidationResult {
  /** Whether all required checks passed */
  valid: boolean;
  /** Detailed results for each check */
  results: HandoffValidationOutcome[];
  /** Checks that failed (subset of results) */
  failedChecks?: HandoffValidationCheck[];
}

/**
 * Run session handoff validation checks.
 */
export async function runHandoffValidation(
  options: RunHandoffValidationOptions
): Promise<RunHandoffValidationResult> {
  const projectRoot = options.projectRoot || process.cwd();
  const taskConfig: TaskConfig = { ...DEFAULT_TASK_CONFIG, ...(options.taskConfig || {}) };
  const modifiedFiles = await resolveModifiedFiles(projectRoot, options.modifiedFiles);

  const context: ValidationContext = {
    projectRoot,
    taskConfig,
    modifiedFiles,
    taskScopeGlobs: options.taskScopeGlobs || [],
    from: options.from,
    to: options.to,
    task: options.task,
    taskContent: options.taskContent,
    chainId: options.chainId,
  };

  const checks = resolveChecks(options);
  const requiredChecks = options.requiredChecks || checks;

  const results: HandoffValidationOutcome[] = [];

  for (const check of checks) {
    try {
      const outcome = await runCheck(check, context);
      results.push(outcome);
    } catch (error) {
      results.push({
        check,
        success: false,
        feedback: [`Validation check ${check} failed: ${(error as Error).message}`],
      });
    }
  }

  const failedChecks = results
    .filter((result) => !result.success && requiredChecks.includes(result.check))
    .map((result) => result.check);

  return {
    valid: failedChecks.length === 0,
    results,
    failedChecks: failedChecks.length > 0 ? failedChecks : undefined,
  };
}

async function runCheck(
  check: HandoffValidationCheck,
  context: ValidationContext
): Promise<HandoffValidationOutcome> {
  switch (check) {
    case "task_format":
      return runTaskFormatCheck(context);
    case "uncommitted_work":
      return runUncommittedWorkCheck(context);
    case "handoff_notes":
      return runHandoffNotesCheck(context);
    case "role_match":
      return runRoleMatchCheck(context);
    case "blocking_feedback":
      return runBlockingFeedbackCheck(context);
    default:
      return {
        check,
        success: false,
        feedback: [`Unknown validation check: ${check}`],
      };
  }
}

function resolveChecks(config: HandoffValidationConfig): HandoffValidationCheck[] {
  if (config.defaultChecks) {
    return config.defaultChecks;
  }
  return [...HANDOFF_VALIDATION_CHECKS];
}

/**
 * Validates task file structure has required sections.
 */
async function runTaskFormatCheck(context: ValidationContext): Promise<HandoffValidationOutcome> {
  const content = await resolveTaskContent(context);
  if (!content) {
    return {
      check: "task_format",
      success: false,
      feedback: ["No task content available to validate"],
    };
  }

  const feedback: string[] = [];
  const requiredSections = ["description", "acceptance criteria"];

  for (const section of requiredSections) {
    if (!hasSection(content, section)) {
      feedback.push(`Missing required section: ${section}`);
    }
  }

  const hasTitle = /^#\s+.+/m.test(content);
  if (!hasTitle) {
    feedback.push("Task file missing title (# heading)");
  }

  const hasMetadata = /\*\*ID\*\*:/.test(content) && /\*\*Status\*\*:/.test(content);
  if (!hasMetadata) {
    feedback.push("Task file missing required metadata (ID, Status)");
  }

  if (feedback.length > 0) {
    return { check: "task_format", success: false, feedback };
  }
  return { check: "task_format", success: true };
}

/**
 * Detects uncommitted changes within the task's file scope.
 */
async function runUncommittedWorkCheck(
  context: ValidationContext
): Promise<HandoffValidationOutcome> {
  if (context.taskScopeGlobs.length === 0) {
    return { check: "uncommitted_work", success: true };
  }

  const uncommittedInScope = context.modifiedFiles.filter((file) =>
    context.taskScopeGlobs.some((glob) => matchGlob(glob, file))
  );

  if (uncommittedInScope.length > 0) {
    return {
      check: "uncommitted_work",
      success: false,
      feedback: [
        `Uncommitted changes in task scope: ${uncommittedInScope.join(", ")}`,
        "Commit or stash changes before handoff",
      ],
    };
  }

  return { check: "uncommitted_work", success: true };
}

/**
 * Verifies handoff context/notes section is present and populated.
 */
async function runHandoffNotesCheck(context: ValidationContext): Promise<HandoffValidationOutcome> {
  const content = await resolveTaskContent(context);
  if (!content) {
    return {
      check: "handoff_notes",
      success: false,
      feedback: ["No task content available to check for handoff notes"],
    };
  }

  const hasHandoffContext = hasSection(content, "handoff context");
  const hasCompletionNotes = hasSection(content, "completion notes");

  if (!hasHandoffContext && !hasCompletionNotes) {
    return {
      check: "handoff_notes",
      success: false,
      feedback: [
        "Missing handoff context or completion notes section",
        "Add a '## Handoff Context' or '## Completion Notes' section with current state",
      ],
    };
  }

  const notesSection = extractSection(content, "handoff context") ||
    extractSection(content, "completion notes");

  if (notesSection && notesSection.includes("[Added when")) {
    return {
      check: "handoff_notes",
      success: false,
      feedback: ["Handoff notes section contains placeholder text - please fill in actual context"],
    };
  }

  return { check: "handoff_notes", success: true };
}

/**
 * Validates that the receiving agent role matches the task type.
 */
async function runRoleMatchCheck(context: ValidationContext): Promise<HandoffValidationOutcome> {
  const { from, to, task } = context;

  if (!task) {
    return { check: "role_match", success: true };
  }

  const taskType = task.type || "impl";
  const feedback: string[] = [];

  if (taskType === "impl" && to === "control") {
    if (task.status !== "done" && task.status !== "in-review") {
      feedback.push(
        `Impl task handed to control agent but task status is ${task.status}; expected done or in-review`
      );
    }
  }

  if (taskType === "control" && to === "impl") {
    feedback.push("Control task should not be handed to impl agent");
  }

  if (from === to && from !== "impl" && from !== "control") {
    feedback.push(`Same-role handoff (${from} → ${to}) - consider if this is intentional`);
  }

  if (feedback.length > 0) {
    return { check: "role_match", success: false, feedback };
  }
  return { check: "role_match", success: true };
}

/**
 * Checks for unresolved blocking feedback items.
 */
async function runBlockingFeedbackCheck(
  context: ValidationContext
): Promise<HandoffValidationOutcome> {
  const content = await resolveTaskContent(context);
  if (!content) {
    return { check: "blocking_feedback", success: true };
  }

  const feedbackSection = extractSection(content, "feedback");
  if (!feedbackSection) {
    return { check: "blocking_feedback", success: true };
  }

  const blockingPatterns = [
    /\[blocking\]/i,
    /\*\*blocking\*\*/i,
    /status:\s*blocking/i,
    /- \[ \].*block/i,
  ];

  const hasBlocking = blockingPatterns.some((pattern) => pattern.test(feedbackSection));

  if (hasBlocking) {
    return {
      check: "blocking_feedback",
      success: false,
      feedback: [
        "Unresolved blocking feedback found",
        "Resolve blocking items before handoff",
      ],
    };
  }

  return { check: "blocking_feedback", success: true };
}

async function resolveTaskContent(context: ValidationContext): Promise<string | null> {
  if (context.taskContent) {
    return context.taskContent;
  }

  if (!context.task || !context.chainId) {
    return null;
  }

  const taskPath = path.join(
    context.projectRoot,
    context.taskConfig.tasksPath,
    context.task.status,
    context.chainId,
    `${context.task.id}.md`
  );

  try {
    return await fs.readFile(taskPath, "utf-8");
  } catch {
    return null;
  }
}

function hasSection(content: string, sectionName: string): boolean {
  const pattern = new RegExp(`^##\\s+${escapeRegex(sectionName)}`, "im");
  return pattern.test(content);
}

function extractSection(content: string, sectionName: string): string | null {
  const lines = content.split("\n");
  const target = sectionName.toLowerCase();
  let current: string | null = null;
  const buffer: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      const name = line.slice(3).trim().toLowerCase();
      if (current === target) {
        break;
      }
      current = name;
      continue;
    }

    if (line === "---") {
      if (current === target) {
        break;
      }
      current = null;
      continue;
    }

    if (current === target) {
      buffer.push(line);
    }
  }

  const result = buffer.join("\n").trim();
  return result.length > 0 ? result : null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function resolveModifiedFiles(
  projectRoot: string,
  provided?: string[]
): Promise<string[]> {
  if (provided && provided.length > 0) {
    return provided;
  }

  try {
    const { stdout } = await execFileAsync("git", ["status", "--porcelain"], {
      cwd: projectRoot,
      encoding: "utf-8",
    });

    const output = stdout as string;

    return output
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .map((line: string) => line.slice(3));
  } catch {
    return [];
  }
}

/**
 * Parse handoff context from task content.
 */
export function parseHandoffContext(content: string): HandoffContext | null {
  const section = extractSection(content, "handoff context");
  if (!section) {
    return null;
  }

  const sessionMatch = section.match(/\*\*Session\*\*:\s*(.+)/);
  const fromMatch = section.match(/\*\*From\*\*:\s*(\w+)/);
  const toMatch = section.match(/\*\*To\*\*:\s*(\w+)/);
  const stateMatch = section.match(/\*\*State\*\*:\s*(.+)/);

  if (!sessionMatch || !fromMatch || !toMatch || !stateMatch) {
    return null;
  }

  const whatDone = extractListItems(section, "what was done");
  const whatNext = extractListItems(section, "what needs to happen");
  const openQuestions = extractListItems(section, "open questions");

  return {
    session: sessionMatch[1].trim(),
    from: fromMatch[1].trim() as HandoffAgentRole,
    to: toMatch[1].trim() as HandoffAgentRole,
    state: stateMatch[1].trim(),
    whatDone,
    whatNext,
    openQuestions: openQuestions.length > 0 ? openQuestions : undefined,
  };
}

function extractListItems(content: string, heading: string): string[] {
  const lines = content.split("\n");
  const items: string[] = [];
  let inSection = false;

  for (const line of lines) {
    if (line.toLowerCase().includes(heading.toLowerCase())) {
      inSection = true;
      continue;
    }

    if (inSection) {
      if (line.startsWith("###") || line.startsWith("**")) {
        break;
      }
      const match = line.match(/^-\s+(.+)/);
      if (match) {
        items.push(match[1].trim());
      }
    }
  }

  return items;
}
