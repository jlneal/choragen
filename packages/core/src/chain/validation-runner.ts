/**
 * Chain completion validation runner
 *
 * Executes configured validation checks for a chain and aggregates results.
 *
 * ADR: ADR-001-task-file-format
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Chain, Task, TaskConfig } from "../tasks/types.js";
import { DEFAULT_TASK_CONFIG } from "../tasks/types.js";
import {
  type ChainValidationCheck,
  type ChainValidationOutcome,
  type ChainValidationConfig,
  type ChainCompletionGateResult,
  CHAIN_VALIDATION_CHECKS,
} from "./validation-types.js";
import { matchGlob } from "../utils/index.js";

const execFileAsync = promisify(execFile);

const DEFAULT_DESIGN_DOC_GLOBS = ["docs/design/**", "docs/adr/**", "docs/architecture.md"];
const DEFAULT_TEST_FILE_GLOBS = ["**/__tests__/**", "**/*.test.*", "**/*.spec.*"];

/** Options for running chain validation */
export interface RunChainValidationOptions extends ChainValidationConfig {
  /** Repository root for locating task files (defaults to process.cwd) */
  projectRoot?: string;
  /** Optional task config override (tasksPath, etc.) */
  taskConfig?: Partial<TaskConfig>;
  /** Explicit list of modified files (skips git status when provided) */
  modifiedFiles?: string[];
}

type ValidationContext = {
  projectRoot: string;
  taskConfig: TaskConfig;
  modifiedFiles: string[];
  designDocGlobs: string[];
  testFileGlobs: string[];
};

/**
 * Run chain completion validation checks.
 */
export async function runChainValidation(
  chain: Chain,
  options: RunChainValidationOptions
): Promise<ChainCompletionGateResult> {
  const projectRoot = options.projectRoot || process.cwd();
  const taskConfig: TaskConfig = { ...DEFAULT_TASK_CONFIG, ...(options.taskConfig || {}) };
  const modifiedFiles = await resolveModifiedFiles(projectRoot, options.modifiedFiles);

  const context: ValidationContext = {
    projectRoot,
    taskConfig,
    modifiedFiles,
    designDocGlobs: options.designDocGlobs || DEFAULT_DESIGN_DOC_GLOBS,
    testFileGlobs: options.testFileGlobs || DEFAULT_TEST_FILE_GLOBS,
  };

  const checks = resolveChecks(chain.id, options);
  const requiredChecks = options.requiredChecks || checks;

  const results: ChainValidationOutcome[] = [];

  for (const check of checks) {
    try {
      const outcome = await runCheck(check, chain, context);
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
    chainId: chain.id,
    valid: failedChecks.length === 0,
    results,
    failedChecks: failedChecks.length > 0 ? failedChecks : undefined,
  };
}

async function runCheck(
  check: ChainValidationCheck,
  chain: Chain,
  context: ValidationContext
): Promise<ChainValidationOutcome> {
  switch (check) {
    case "task_state":
      return runTaskStateCheck(chain);
    case "completion_notes":
      return runCompletionNotesCheck(chain, context);
    case "acceptance_criteria":
      return runAcceptanceCriteriaCheck(chain, context);
    case "design_doc_updates":
      return runDesignDocUpdatesCheck(chain, context);
    case "test_coverage":
      return runTestCoverageCheck(chain, context);
    default:
      return {
        check,
        success: false,
        feedback: [`Unknown validation check: ${check}`],
      };
  }
}

function resolveChecks(chainId: string, config: ChainValidationConfig): ChainValidationCheck[] {
  if (config.chainOverrides && config.chainOverrides[chainId]) {
    return config.chainOverrides[chainId];
  }
  if (config.defaultChecks) {
    return config.defaultChecks;
  }
  return [...CHAIN_VALIDATION_CHECKS];
}

async function runTaskStateCheck(chain: Chain): Promise<ChainValidationOutcome> {
  const feedback: string[] = [];

  if (!chain.tasks || chain.tasks.length === 0) {
    return {
      check: "task_state",
      success: false,
      feedback: ["Chain has no tasks to validate"],
    };
  }

  for (const task of chain.tasks) {
    if (task.status !== "done") {
      feedback.push(`Task ${task.id} status is ${task.status}; expected done`);
    }
  }

  if (feedback.length > 0) {
    return { check: "task_state", success: false, feedback };
  }
  return { check: "task_state", success: true };
}

async function runCompletionNotesCheck(
  chain: Chain,
  context: ValidationContext
): Promise<ChainValidationOutcome> {
  const feedback: string[] = [];

  for (const task of chain.tasks || []) {
    const content = await readTaskFile(chain, task, context);
    if (!content) {
      feedback.push(`Task file missing for ${task.id}`);
      continue;
    }

    const completionNotes = extractSection(content, "completion notes");
    if (!completionNotes) {
      feedback.push(`Task ${task.id} missing completion notes`);
    }
  }

  if (feedback.length > 0) {
    return { check: "completion_notes", success: false, feedback };
  }
  return { check: "completion_notes", success: true };
}

async function runAcceptanceCriteriaCheck(
  chain: Chain,
  context: ValidationContext
): Promise<ChainValidationOutcome> {
  const feedback: string[] = [];

  for (const task of chain.tasks || []) {
    const content = await readTaskFile(chain, task, context);
    if (!content) {
      feedback.push(`Task file missing for ${task.id}`);
      continue;
    }

    const acceptanceContent = extractSection(content, "acceptance criteria");
    if (!acceptanceContent) {
      feedback.push(`Task ${task.id} missing acceptance criteria section`);
      continue;
    }

    const unchecked = findUncheckedItems(acceptanceContent);
    if (unchecked.length > 0) {
      feedback.push(
        `Task ${task.id} has unchecked acceptance criteria: ${unchecked.join(", ")}`
      );
    }
  }

  if (feedback.length > 0) {
    return { check: "acceptance_criteria", success: false, feedback };
  }
  return { check: "acceptance_criteria", success: true };
}

async function runDesignDocUpdatesCheck(
  chain: Chain,
  context: ValidationContext
): Promise<ChainValidationOutcome> {
  const fileScope = chain.fileScope || [];
  const relevant = fileScope.some((scope) =>
    context.designDocGlobs.some((designGlob) => globsOverlap(scope, designGlob))
  );

  if (!relevant) {
    return { check: "design_doc_updates", success: true };
  }

  const designFiles = context.modifiedFiles.filter((file) =>
    matchesAny(context.designDocGlobs, file)
  );

  if (designFiles.length === 0) {
    return {
      check: "design_doc_updates",
      success: false,
      feedback: [
        `Chain scope includes design docs but none were modified. Expected updates matching: ${context.designDocGlobs.join(
          ", "
        )}`,
      ],
    };
  }

  return {
    check: "design_doc_updates",
    success: true,
    feedback: [`Design docs updated: ${designFiles.join(", ")}`],
  };
}

async function runTestCoverageCheck(
  chain: Chain,
  context: ValidationContext
): Promise<ChainValidationOutcome> {
  const tasks = chain.tasks || [];
  const hasImplTasks = tasks.some((task) => (task.type || "impl") === "impl");
  if (!hasImplTasks) {
    return { check: "test_coverage", success: true };
  }

  const testFiles = context.modifiedFiles.filter((file) =>
    matchesAny(context.testFileGlobs, file)
  );

  if (testFiles.length === 0) {
    const sourceFiles = context.modifiedFiles.filter(
      (file) => !matchesAny(context.testFileGlobs, file)
    );

    return {
      check: "test_coverage",
      success: false,
      feedback: [
        sourceFiles.length > 0
          ? `No tests updated for modified files: ${sourceFiles.join(", ")}`
          : "No modified files provided to verify test coverage",
      ],
    };
  }

  return {
    check: "test_coverage",
    success: true,
    feedback: [`Test coverage validated via: ${testFiles.join(", ")}`],
  };
}

async function readTaskFile(
  chain: Chain,
  task: Task,
  context: ValidationContext
): Promise<string | null> {
  const taskPath = path.join(
    context.projectRoot,
    context.taskConfig.tasksPath,
    task.status,
    chain.id,
    `${task.id}.md`
  );

  try {
    return await fs.readFile(taskPath, "utf-8");
  } catch {
    return null;
  }
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

function findUncheckedItems(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- ["))
    .filter((line) => /\[\s]/.test(line))
    .map((line) => line.replace(/^- \[[ x]\]\s*/, "").trim())
    .filter((line) => line.length > 0);
}

function matchesAny(patterns: string[], candidate: string): boolean {
  return patterns.some((pattern) => matchGlob(pattern, candidate));
}

function globsOverlap(a: string, b: string): boolean {
  if (a === b) return true;
  const aBase = a.replace(/\*+.*$/, "");
  const bBase = b.replace(/\*+.*$/, "");
  return aBase.startsWith(bBase) || bBase.startsWith(aBase);
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
