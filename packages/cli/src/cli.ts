// ADR: ADR-001-task-file-format

/**
 * CLI implementation
 */

import { ChainManager, LockManager } from "@choragen/core";
import {
  parseGovernanceFile,
  GovernanceChecker,
  formatCheckSummary,
} from "@choragen/core";

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
    usage: "chain:new <request-id> <slug> [title]",
    handler: async (args) => {
      const [requestId, slug, ...titleParts] = args;
      if (!requestId || !slug) {
        console.error("Usage: choragen chain:new <request-id> <slug> [title]");
        process.exit(1);
      }
      const title = titleParts.join(" ") || slug;
      const chain = await chainManager.createChain({
        requestId,
        slug,
        title,
      });
      console.log(`Created chain: ${chain.id}`);
      console.log(`  Request: ${chain.requestId}`);
      console.log(`  Title: ${chain.title}`);
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
            console.log(
              `  ${chain.id}: ${summary.status} (${summary.progress.toFixed(0)}% complete)`
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
        console.log(`${chain.id} [${status}] - ${chain.title}`);
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
