// ADR: ADR-001-task-file-format

/**
 * CLI implementation
 */

import { ChainManager, LockManager, CHAIN_TYPES, type ChainType } from "@choragen/core";
import {
  parseGovernanceFile,
  GovernanceChecker,
  formatCheckSummary,
} from "@choragen/core";
import { initProject, formatInitResult, InitOptions } from "./commands/init.js";
import * as readline from "node:readline";

/**
 * Prompt user for text input with optional default
 * @param question - The question to ask
 * @param defaultValue - Default value if user presses enter
 * @returns The user's input or the default value
 */
async function prompt(question: string, defaultValue?: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const displayQuestion = defaultValue
    ? `${question} (${defaultValue}): `
    : `${question}: `;

  return new Promise((resolve) => {
    rl.question(displayQuestion, (answer) => {
      rl.close();
      const trimmed = answer.trim();
      resolve(trimmed || defaultValue || "");
    });
  });
}

/**
 * Prompt user for yes/no confirmation
 * @param question - The question to ask
 * @returns true if user answers yes (or presses enter for default yes)
 */
async function promptYesNo(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question + " ", (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      // Default to yes if empty, otherwise check for explicit yes
      resolve(normalized === "" || normalized === "y" || normalized === "yes");
    });
  });
}

interface CommandDef {
  description: string;
  usage?: string;
  handler: (args: string[]) => Promise<void>;
}

const projectRoot = process.cwd();

// Initialize managers
const chainManager = new ChainManager(projectRoot);
const taskManager = chainManager.getTaskManager();
const lockManager = new LockManager(projectRoot);

const commands: Record<string, CommandDef> = {
  // Chain lifecycle
  "chain:new": {
    description: "Create a new task chain from a CR/FR",
    usage: "chain:new <request-id> <slug> [title] [--type=design|implementation] [--depends-on=CHAIN-xxx]",
    handler: async (args) => {
      // Parse flags from args
      const positionalArgs: string[] = [];
      let type: ChainType | undefined;
      let dependsOn: string | undefined;

      for (const arg of args) {
        if (arg.startsWith("--type=")) {
          const typeValue = arg.slice("--type=".length);
          if (!CHAIN_TYPES.includes(typeValue as ChainType)) {
            console.error(`Invalid type: ${typeValue}. Must be one of: ${CHAIN_TYPES.join(", ")}`);
            process.exit(1);
          }
          type = typeValue as ChainType;
        } else if (arg.startsWith("--depends-on=")) {
          dependsOn = arg.slice("--depends-on=".length);
        } else {
          positionalArgs.push(arg);
        }
      }

      const [requestId, slug, ...titleParts] = positionalArgs;
      if (!requestId || !slug) {
        console.error("Usage: choragen chain:new <request-id> <slug> [title] [--type=design|implementation]");
        process.exit(1);
      }
      const title = titleParts.join(" ") || slug;
      const chain = await chainManager.createChain({
        requestId,
        slug,
        title,
        type,
        dependsOn,
      });
      console.log(`Created chain: ${chain.id}`);
      console.log(`  Request: ${chain.requestId}`);
      console.log(`  Title: ${chain.title}`);
      if (chain.type) {
        console.log(`  Type: ${chain.type}`);
      }
      if (chain.dependsOn) {
        console.log(`  Depends on: ${chain.dependsOn}`);
      }
    },
  },

  "chain:new:design": {
    description: "Create a new design chain (shorthand for --type=design)",
    usage: "chain:new:design <request-id> <slug> [title]",
    handler: async (args) => {
      const [requestId, slug, ...titleParts] = args;
      if (!requestId || !slug) {
        console.error("Usage: choragen chain:new:design <request-id> <slug> [title]");
        process.exit(1);
      }
      const title = titleParts.join(" ") || slug;
      const chain = await chainManager.createChain({
        requestId,
        slug,
        title,
        type: "design",
      });
      console.log(`Created design chain: ${chain.id}`);
      console.log(`  Request: ${chain.requestId}`);
      console.log(`  Title: ${chain.title}`);
      console.log(`  Type: design`);
    },
  },

  "chain:new:impl": {
    description: "Create a new implementation chain (shorthand for --type=implementation)",
    usage: "chain:new:impl <request-id> <slug> [title] [--depends-on=CHAIN-xxx] [--skip-design=\"justification\"]",
    handler: async (args) => {
      // Parse flags from args
      const positionalArgs: string[] = [];
      let dependsOn: string | undefined;
      let skipDesignJustification: string | undefined;

      for (const arg of args) {
        if (arg.startsWith("--depends-on=")) {
          dependsOn = arg.slice("--depends-on=".length);
        } else if (arg.startsWith("--skip-design=")) {
          skipDesignJustification = arg.slice("--skip-design=".length);
        } else {
          positionalArgs.push(arg);
        }
      }

      const [requestId, slug, ...titleParts] = positionalArgs;
      if (!requestId || !slug) {
        console.error("Usage: choragen chain:new:impl <request-id> <slug> [title] [--depends-on=CHAIN-xxx]");
        process.exit(1);
      }

      // Require either --depends-on or --skip-design
      if (!dependsOn && !skipDesignJustification) {
        console.error("Error: Implementation chains require either --depends-on=<design-chain-id> or --skip-design=\"justification\"");
        console.error("  --depends-on: Link to the design chain this implements");
        console.error("  --skip-design: Justification for skipping design (e.g., hotfix, trivial change)");
        process.exit(1);
      }

      const title = titleParts.join(" ") || slug;
      const chain = await chainManager.createChain({
        requestId,
        slug,
        title,
        type: "implementation",
        dependsOn,
      });

      console.log(`Created implementation chain: ${chain.id}`);
      console.log(`  Request: ${chain.requestId}`);
      console.log(`  Title: ${chain.title}`);
      console.log(`  Type: implementation`);
      if (chain.dependsOn) {
        console.log(`  Depends on: ${chain.dependsOn}`);
      }
      if (skipDesignJustification) {
        console.log(`  Skip design justification: ${skipDesignJustification}`);
      }
    },
  },

  "chain:status": {
    description: "Show chain status",
    usage: "chain:status <chain-id>",
    handler: async (args) => {
      const [chainId] = args;
      if (!chainId) {
        // Show all chains
        const chains = await chainManager.getAllChains();
        if (chains.length === 0) {
          console.log("No chains found.");
          return;
        }
        console.log("Chains:");
        for (const chain of chains) {
          const summary = await chainManager.getChainSummary(chain.id);
          if (summary) {
            const typeStr = chain.type ? ` [${chain.type}]` : "";
            console.log(
              `  ${chain.id}${typeStr}: ${summary.status} (${summary.progress.toFixed(0)}% complete)`
            );
          }
        }
        return;
      }

      const summary = await chainManager.getChainSummary(chainId);
      if (!summary) {
        console.error(`Chain not found: ${chainId}`);
        process.exit(1);
      }

      console.log(`Chain: ${summary.chain.id}`);
      console.log(`  Request: ${summary.chain.requestId}`);
      console.log(`  Title: ${summary.chain.title}`);
      if (summary.chain.type) {
        console.log(`  Type: ${summary.chain.type}`);
      }
      if (summary.chain.dependsOn) {
        console.log(`  Depends on: ${summary.chain.dependsOn}`);
      }
      console.log(`  Status: ${summary.status}`);
      console.log(`  Progress: ${summary.progress.toFixed(0)}%`);
      console.log(`  Tasks:`);
      console.log(`    Backlog: ${summary.taskCounts.backlog}`);
      console.log(`    Todo: ${summary.taskCounts.todo}`);
      console.log(`    In Progress: ${summary.taskCounts["in-progress"]}`);
      console.log(`    In Review: ${summary.taskCounts["in-review"]}`);
      console.log(`    Done: ${summary.taskCounts.done}`);
      console.log(`    Blocked: ${summary.taskCounts.blocked}`);
    },
  },

  "chain:list": {
    description: "List all chains",
    handler: async () => {
      const chains = await chainManager.getAllChains();
      if (chains.length === 0) {
        console.log("No chains found.");
        return;
      }
      for (const chain of chains) {
        const summary = await chainManager.getChainSummary(chain.id);
        const status = summary ? summary.status : "unknown";
        const typeStr = chain.type ? `[${chain.type}]` : "";
        const typeCol = typeStr.padEnd(16);
        console.log(`${chain.id} ${typeCol} [${status}] - ${chain.title}`);
      }
    },
  },

  // Task lifecycle
  "task:add": {
    description: "Add a task to a chain",
    usage: "task:add <chain-id> <slug> <title>",
    handler: async (args) => {
      const [chainId, slug, ...titleParts] = args;
      if (!chainId || !slug || titleParts.length === 0) {
        console.error("Usage: choragen task:add <chain-id> <slug> <title>");
        process.exit(1);
      }
      const title = titleParts.join(" ");
      const task = await chainManager.addTask(chainId, {
        slug,
        title,
        description: "",
      });
      console.log(`Created task: ${task.id}`);
      console.log(`  Chain: ${task.chainId}`);
      console.log(`  Title: ${task.title}`);
      console.log(`  Status: ${task.status}`);
    },
  },

  "task:ready": {
    description: "Mark a task as ready to work (move to todo)",
    usage: "task:ready <chain-id> <task-id>",
    handler: async (args) => {
      const [chainId, taskId] = args;
      if (!chainId || !taskId) {
        console.error("Usage: choragen task:ready <chain-id> <task-id>");
        process.exit(1);
      }
      const result = await taskManager.transitionTask(chainId, taskId, "todo");
      if (!result.success) {
        console.error(`Failed to ready task: ${result.error}`);
        process.exit(1);
      }
      console.log(`Task ready: ${result.task.id}`);
      console.log(`  ${result.previousStatus} → ${result.newStatus}`);
    },
  },

  "task:start": {
    description: "Start a task (move to in-progress)",
    usage: "task:start <chain-id> <task-id>",
    handler: async (args) => {
      const [chainId, taskId] = args;
      if (!chainId || !taskId) {
        console.error("Usage: choragen task:start <chain-id> <task-id>");
        process.exit(1);
      }
      const result = await taskManager.startTask(chainId, taskId);
      if (!result.success) {
        console.error(`Failed to start task: ${result.error}`);
        process.exit(1);
      }
      console.log(`Started task: ${result.task.id}`);
      console.log(`  ${result.previousStatus} → ${result.newStatus}`);
    },
  },

  "task:complete": {
    description: "Complete a task (move to in-review)",
    usage: "task:complete <chain-id> <task-id>",
    handler: async (args) => {
      const [chainId, taskId] = args;
      if (!chainId || !taskId) {
        console.error("Usage: choragen task:complete <chain-id> <task-id>");
        process.exit(1);
      }
      const result = await taskManager.completeTask(chainId, taskId);
      if (!result.success) {
        console.error(`Failed to complete task: ${result.error}`);
        process.exit(1);
      }
      console.log(`Completed task: ${result.task.id}`);
      console.log(`  ${result.previousStatus} → ${result.newStatus}`);
    },
  },

  "task:approve": {
    description: "Approve a task (move to done)",
    usage: "task:approve <chain-id> <task-id>",
    handler: async (args) => {
      const [chainId, taskId] = args;
      if (!chainId || !taskId) {
        console.error("Usage: choragen task:approve <chain-id> <task-id>");
        process.exit(1);
      }
      const result = await taskManager.approveTask(chainId, taskId);
      if (!result.success) {
        console.error(`Failed to approve task: ${result.error}`);
        process.exit(1);
      }
      console.log(`Approved task: ${result.task.id}`);
      console.log(`  ${result.previousStatus} → ${result.newStatus}`);
    },
  },

  "task:rework": {
    description: "Send a task back for rework",
    usage: "task:rework <chain-id> <task-id>",
    handler: async (args) => {
      const [chainId, taskId] = args;
      if (!chainId || !taskId) {
        console.error("Usage: choragen task:rework <chain-id> <task-id>");
        process.exit(1);
      }
      const result = await taskManager.reworkTask(chainId, taskId);
      if (!result.success) {
        console.error(`Failed to rework task: ${result.error}`);
        process.exit(1);
      }
      console.log(`Sent task back for rework: ${result.task.id}`);
      console.log(`  ${result.previousStatus} → ${result.newStatus}`);
    },
  },

  "task:block": {
    description: "Block a task",
    usage: "task:block <chain-id> <task-id>",
    handler: async (args) => {
      const [chainId, taskId] = args;
      if (!chainId || !taskId) {
        console.error("Usage: choragen task:block <chain-id> <task-id>");
        process.exit(1);
      }
      const result = await taskManager.blockTask(chainId, taskId);
      if (!result.success) {
        console.error(`Failed to block task: ${result.error}`);
        process.exit(1);
      }
      console.log(`Blocked task: ${result.task.id}`);
      console.log(`  ${result.previousStatus} → ${result.newStatus}`);
    },
  },

  "task:next": {
    description: "Show next available task for a chain",
    usage: "task:next <chain-id>",
    handler: async (args) => {
      const [chainId] = args;
      if (!chainId) {
        console.error("Usage: choragen task:next <chain-id>");
        process.exit(1);
      }
      const task = await taskManager.getNextTask(chainId);
      if (!task) {
        console.log("No tasks available.");
        return;
      }
      console.log(`Next task: ${task.id}`);
      console.log(`  Title: ${task.title}`);
      console.log(`  Status: ${task.status}`);
      if (task.description) {
        console.log(`  Description: ${task.description.slice(0, 100)}...`);
      }
    },
  },

  "task:list": {
    description: "List all tasks for a chain",
    usage: "task:list <chain-id>",
    handler: async (args) => {
      const [chainId] = args;
      if (!chainId) {
        console.error("Usage: choragen task:list <chain-id>");
        process.exit(1);
      }
      const tasks = await taskManager.getTasksForChain(chainId);
      if (tasks.length === 0) {
        console.log("No tasks found.");
        return;
      }
      for (const task of tasks) {
        console.log(`${task.id} [${task.status}] - ${task.title}`);
      }
    },
  },

  // Governance
  "governance:check": {
    description: "Check files against governance rules",
    usage: "governance:check <action> <file1> [file2...]",
    handler: async (args) => {
      const [action, ...files] = args;
      if (!action || files.length === 0) {
        console.error(
          "Usage: choragen governance:check <create|modify|delete> <file1> [file2...]"
        );
        process.exit(1);
      }

      if (!["create", "modify", "delete"].includes(action)) {
        console.error("Action must be one of: create, modify, delete");
        process.exit(1);
      }

      const schema = await parseGovernanceFile("choragen.governance.yaml");
      const checker = new GovernanceChecker(schema);

      const mutations = files.map((file) => ({
        file,
        action: action as "create" | "modify" | "delete",
      }));

      const summary = checker.checkAll(mutations);
      console.log(formatCheckSummary(summary));

      if (summary.hasDenied) {
        process.exit(1);
      }
    },
  },

  // Locks
  "lock:acquire": {
    description: "Acquire locks for a chain",
    usage: "lock:acquire <chain-id> <pattern1> [pattern2...]",
    handler: async (args) => {
      const [chainId, ...patterns] = args;
      if (!chainId || patterns.length === 0) {
        console.error(
          "Usage: choragen lock:acquire <chain-id> <pattern1> [pattern2...]"
        );
        process.exit(1);
      }

      const agent = `cli-${Date.now()}`;
      const result = await lockManager.acquire(chainId, patterns, agent);

      if (!result.success) {
        console.error(`Failed to acquire lock: ${result.error}`);
        process.exit(1);
      }

      console.log(`Acquired lock for ${chainId}`);
      console.log(`  Patterns: ${patterns.join(", ")}`);
      if (result.lock?.expiresAt) {
        console.log(`  Expires: ${result.lock.expiresAt.toISOString()}`);
      }
    },
  },

  "lock:release": {
    description: "Release locks for a chain",
    usage: "lock:release <chain-id>",
    handler: async (args) => {
      const [chainId] = args;
      if (!chainId) {
        console.error("Usage: choragen lock:release <chain-id>");
        process.exit(1);
      }

      const released = await lockManager.release(chainId);
      if (released) {
        console.log(`Released lock for ${chainId}`);
      } else {
        console.log(`No lock found for ${chainId}`);
      }
    },
  },

  "lock:status": {
    description: "Show current lock status",
    handler: async () => {
      const status = await lockManager.formatStatus();
      console.log(status);
    },
  },

  // Hooks
  "hooks:install": {
    description: "Install git hooks",
    handler: async () => {
      const { execSync } = await import("node:child_process");
      const { chmodSync, existsSync } = await import("node:fs");
      const { join } = await import("node:path");

      const hooksDir = join(projectRoot, "githooks");

      if (!existsSync(hooksDir)) {
        console.error("No githooks directory found");
        process.exit(1);
      }

      try {
        // Make hooks executable
        const hooks = ["commit-msg", "pre-commit", "pre-push"];
        for (const hook of hooks) {
          const hookPath = join(hooksDir, hook);
          if (existsSync(hookPath)) {
            chmodSync(hookPath, 0o755);
          }
        }

        // Configure git to use the hooks directory
        execSync("git config core.hooksPath githooks", { cwd: projectRoot });

        console.log("✓ Git hooks installed");
        console.log("  Hooks directory: githooks/");
        console.log("  Active hooks: commit-msg, pre-commit");
      } catch (error) {
        console.error("Failed to install hooks:", (error as Error).message);
        process.exit(1);
      }
    },
  },

  // Init
  init: {
    description: "Initialize a new Choragen project",
    usage: "init [--non-interactive] [--skip-hooks] [--name <name>] [--domain <domain>]",
    handler: async (args) => {
      const options: InitOptions = {};
      let nonInteractive = false;
      let nameProvided = false;
      let domainProvided = false;

      // Parse arguments
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--skip-hooks") {
          options.skipHooks = true;
        } else if (arg === "--non-interactive") {
          nonInteractive = true;
        } else if (arg === "--name" && args[i + 1]) {
          options.projectName = args[++i];
          nameProvided = true;
        } else if (arg.startsWith("--name=")) {
          options.projectName = arg.slice("--name=".length);
          nameProvided = true;
        } else if (arg === "--domain" && args[i + 1]) {
          options.domain = args[++i];
          domainProvided = true;
        } else if (arg.startsWith("--domain=")) {
          options.domain = arg.slice("--domain=".length);
          domainProvided = true;
        }
      }

      // Get directory name as default project name
      const { basename } = await import("node:path");
      const defaultProjectName = basename(projectRoot);
      const defaultDomain = "core";

      // Interactive mode: prompt for values not provided via flags
      if (!nonInteractive) {
        // Prompt for project name if not provided
        if (!nameProvided) {
          options.projectName = await prompt("Project name", defaultProjectName);
        }

        // Prompt for domain if not provided
        if (!domainProvided) {
          options.domain = await prompt("Primary domain", defaultDomain);
        }

        // Prompt for git hooks if not skipping
        if (!options.skipHooks) {
          const answer = await promptYesNo("Install git hooks? (Y/n)");
          options.installHooks = answer;
        }
      } else {
        // Non-interactive: use defaults for unprovided values
        if (!nameProvided) {
          options.projectName = defaultProjectName;
        }
        if (!domainProvided) {
          options.domain = defaultDomain;
        }
        // Don't install hooks in non-interactive mode unless explicitly requested
        options.installHooks = false;
      }

      const result = await initProject(projectRoot, options);
      console.log(formatInitResult(result));

      // Show hint if hooks were created but not installed
      if (result.hooksCreated.length > 0 && !result.hooksInstalled) {
        console.log("");
        console.log("To install hooks later, run: choragen hooks:install");
      }
    },
  },

  // Help
  help: {
    description: "Show help",
    handler: async () => {
      console.log(
        "Choragen - The space that enables agents to actualize intent\n"
      );
      console.log("Usage: choragen <command> [options]\n");
      console.log("Commands:");
      for (const [cmd, def] of Object.entries(commands)) {
        console.log(`  ${cmd.padEnd(24)} ${def.description}`);
      }
    },
  },
};

export async function run(args: string[]): Promise<void> {
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    await commands.help.handler([]);
    return;
  }

  const cmd = commands[command];
  if (!cmd) {
    console.error(`Unknown command: ${command}`);
    console.error("Run 'choragen help' for available commands.");
    process.exit(1);
  }

  await cmd.handler(args.slice(1));
}
