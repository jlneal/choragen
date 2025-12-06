#!/usr/bin/env node
/**
 * Task Runner for Choragen
 *
 * Provides a consistent interface for running all project commands
 * with JSON output support for agent consumption.
 *
 * Usage:
 *   node scripts/run.mjs <command> [options]
 *   node scripts/run.mjs help
 *   node scripts/run.mjs <command> --json
 */

import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

// ============================================================================
// Configuration
// ============================================================================

/**
 * @typedef {{
 *   command: string;
 *   args: string[];
 *   description: string;
 *   forwardArgs?: boolean;
 * }} TaskConfig
 */

/** @type {Record<string, TaskConfig>} */
const tasks = {
  // Build & Test
  build: {
    command: "pnpm",
    args: ["build"],
    description: "Build all packages",
  },
  test: {
    command: "pnpm",
    args: ["test"],
    description: "Run all tests",
    forwardArgs: true,
  },
  typecheck: {
    command: "pnpm",
    args: ["typecheck"],
    description: "Type check all packages",
  },
  lint: {
    command: "pnpm",
    args: ["lint"],
    description: "Run ESLint",
    forwardArgs: true,
  },

  // Validation - All
  "validate:all": {
    command: "node",
    args: [join(__dirname, "run-validators.mjs")],
    description: "Run all validation scripts",
  },

  // Individual validators
  "validate:links": {
    command: "node",
    args: [join(__dirname, "validate-links.mjs")],
    description: "Validate internal documentation links",
    forwardArgs: true,
  },
  "validate:adr": {
    command: "node",
    args: [join(__dirname, "validate-adr-traceability.mjs")],
    description: "Validate ADR traceability",
    forwardArgs: true,
  },
  "validate:adr-staleness": {
    command: "node",
    args: [join(__dirname, "validate-adr-staleness.mjs")],
    description: "Check for stale ADRs",
    forwardArgs: true,
  },
  "validate:agents": {
    command: "node",
    args: [join(__dirname, "validate-agents-md.mjs")],
    description: "Validate AGENTS.md files",
    forwardArgs: true,
  },
  "validate:chain-types": {
    command: "node",
    args: [join(__dirname, "validate-chain-types.mjs")],
    description: "Validate task chain types",
    forwardArgs: true,
  },
  "validate:commits": {
    command: "node",
    args: [join(__dirname, "validate-commit-traceability.mjs")],
    description: "Validate commit traceability",
    forwardArgs: true,
  },
  "validate:complete": {
    command: "node",
    args: [join(__dirname, "validate-complete-traceability.mjs")],
    description: "Validate complete traceability chain",
    forwardArgs: true,
  },
  "validate:contracts": {
    command: "node",
    args: [join(__dirname, "validate-contract-coverage.mjs")],
    description: "Validate DesignContract coverage",
    forwardArgs: true,
  },
  "validate:design-docs": {
    command: "node",
    args: [join(__dirname, "validate-design-doc-content.mjs")],
    description: "Validate design doc content",
    forwardArgs: true,
  },
  "validate:request-completion": {
    command: "node",
    args: [join(__dirname, "validate-request-completion.mjs")],
    description: "Validate request completion notes",
    forwardArgs: true,
  },
  "validate:request-staleness": {
    command: "node",
    args: [join(__dirname, "validate-request-staleness.mjs")],
    description: "Check for stale requests",
    forwardArgs: true,
  },
  "validate:source-adr": {
    command: "node",
    args: [join(__dirname, "validate-source-adr-references.mjs")],
    description: "Validate source ADR references",
    forwardArgs: true,
  },
  "validate:test-coverage": {
    command: "node",
    args: [join(__dirname, "validate-test-coverage.mjs")],
    description: "Validate test coverage",
    forwardArgs: true,
  },

  // Planning
  "cr:new": {
    command: "node",
    args: [join(__dirname, "create-cr.mjs")],
    description: "Create a new change request",
    forwardArgs: true,
  },
  "fr:new": {
    command: "node",
    args: [join(__dirname, "create-fr.mjs")],
    description: "Create a new fix request",
    forwardArgs: true,
  },
  "adr:new": {
    command: "node",
    args: [join(__dirname, "create-adr.mjs")],
    description: "Create a new ADR",
    forwardArgs: true,
  },

  // Utilities
  "work:incomplete": {
    command: "node",
    args: [join(__dirname, "work-incomplete.mjs")],
    description: "List incomplete work items",
    forwardArgs: true,
  },
  "pre-push": {
    command: "node",
    args: [join(__dirname, "pre-push.mjs")],
    description: "Run pre-push checks",
  },
  setup: {
    command: "git",
    args: ["config", "core.hooksPath", "githooks"],
    description: "Configure git hooks",
  },
};

// ============================================================================
// CLI Parsing
// ============================================================================

/**
 * @typedef {{
 *   task: string | undefined;
 *   forwardedArgs: string[];
 *   jsonOutput: boolean;
 *   showHelp: boolean;
 * }} ParsedArgs
 */

/**
 * @param {string[]} argv
 * @returns {ParsedArgs}
 */
function parseArgs(argv) {
  const [, , taskName, ...rest] = argv;

  const showHelp =
    taskName === "help" || taskName === "--help" || taskName === "-h";
  const jsonOutput = rest.includes("--json");
  const forwardedArgs = rest.filter((arg) => arg !== "--json" && arg !== "--");

  return {
    task: showHelp ? undefined : taskName,
    forwardedArgs,
    jsonOutput,
    showHelp,
  };
}

// ============================================================================
// Output Formatting
// ============================================================================

/**
 * @param {object} data
 */
function outputJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * @param {string} message
 * @param {boolean} jsonOutput
 */
function outputError(message, jsonOutput) {
  if (jsonOutput) {
    outputJson({ success: false, error: message });
  } else {
    console.error(`Error: ${message}`);
  }
}

/**
 * @param {boolean} jsonOutput
 */
function showHelpMessage(jsonOutput) {
  const taskList = Object.entries(tasks).map(([name, config]) => ({
    name,
    description: config.description,
  }));

  if (jsonOutput) {
    outputJson({
      success: true,
      commands: taskList,
    });
    return;
  }

  console.log(`
Choragen Task Runner

Usage:
  node scripts/run.mjs <command> [options]

Options:
  --json    Output results as JSON
  --help    Show this help message

Commands:`);

  // Group commands by category
  const categories = {
    "Build & Test": ["build", "test", "typecheck", "lint"],
    Validation: Object.keys(tasks).filter((k) => k.startsWith("validate:")),
    Planning: ["cr:new", "fr:new", "adr:new"],
    Utilities: ["work:incomplete", "pre-push", "setup"],
  };

  for (const [category, commandNames] of Object.entries(categories)) {
    console.log(`\n  ${category}:`);
    for (const name of commandNames) {
      const task = tasks[name];
      if (task) {
        console.log(`    ${name.padEnd(28)} ${task.description}`);
      }
    }
  }

  console.log("");
}

// ============================================================================
// Task Execution
// ============================================================================

/**
 * @param {TaskConfig} task
 * @param {string[]} forwardedArgs
 * @param {boolean} jsonOutput
 * @returns {Promise<number>}
 */
function runTask(task, forwardedArgs, jsonOutput) {
  return new Promise((resolve) => {
    const args = task.forwardArgs
      ? [...task.args, ...forwardedArgs]
      : task.args;

    const child = spawn(task.command, args, {
      cwd: projectRoot,
      stdio: jsonOutput ? "pipe" : "inherit",
      shell: process.platform === "win32",
      env: { ...process.env, FORCE_COLOR: jsonOutput ? "0" : "1" },
    });

    let stdout = "";
    let stderr = "";

    if (jsonOutput) {
      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });
      child.stderr?.on("data", (data) => {
        stderr += data.toString();
      });
    }

    child.on("error", (error) => {
      if (jsonOutput) {
        outputJson({
          success: false,
          error: error.message,
          stdout,
          stderr,
        });
      } else {
        console.error(`Failed to start command: ${error.message}`);
      }
      resolve(1);
    });

    child.on("exit", (code, signal) => {
      const exitCode = code ?? (signal ? 1 : 0);

      if (jsonOutput) {
        // Try to parse stdout as JSON first (for validator scripts)
        let output;
        try {
          output = JSON.parse(stdout);
        } catch {
          output = stdout.trim();
        }

        outputJson({
          success: exitCode === 0,
          exitCode,
          output,
          stderr: stderr.trim() || undefined,
        });
      }

      resolve(exitCode);
    });
  });
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const { task, forwardedArgs, jsonOutput, showHelp } = parseArgs(process.argv);

  if (showHelp || !task) {
    showHelpMessage(jsonOutput);
    process.exit(0);
  }

  const taskConfig = tasks[task];

  if (!taskConfig) {
    outputError(`Unknown command: ${task}\nUse 'help' to list commands.`, jsonOutput);
    process.exit(1);
  }

  const exitCode = await runTask(taskConfig, forwardedArgs, jsonOutput);
  process.exit(exitCode);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
