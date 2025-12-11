// ADR: ADR-001-task-file-format

/**
 * CLI implementation
 */

import {
  ChainManager,
  LockManager,
  CHAIN_TYPES,
  WORKFLOW_STATUSES,
  type ChainType,
  MetricsCollector,
  type TokenUsage,
  type WorkflowStatus,
} from "@choragen/core";
import {
  parseGovernanceFile,
  GovernanceChecker,
  formatCheckSummary,
  checkMutationForRole,
  type AgentRole,
} from "@choragen/core";
import { initProject, formatInitResult, InitOptions } from "./commands/init.js";
import {
  createCR,
  closeCR,
  createFR,
  createADR,
  archiveADR,
  createDesignDoc,
  formatCreateResult,
  DESIGN_TYPES,
  type DesignType,
} from "./commands/docs.js";
import { closeRequest } from "./commands/request-close.js";
import { createReworkTask, formatReworkResult } from "./commands/task-rework.js";
import { getMetricsSummary, formatMetricsSummary, formatMetricsSummaryJson } from "./commands/metrics-summary.js";
import { exportMetrics, writeExport } from "./commands/metrics-export.js";
import { importMetrics, formatImportSummary } from "./commands/metrics-import.js";
import { runTrace, formatTraceHelp } from "./commands/trace.js";
import {
  startSession,
  getSessionStatus,
  endSession,
  formatSessionStatus,
  type SessionRole,
} from "./commands/session.js";
import { runAgentStart, getAgentStartHelp } from "./commands/agent.js";
import {
  runAgentResume,
  runAgentListSessions,
  runAgentCleanup,
  getAgentResumeHelp,
  getAgentListSessionsHelp,
  getAgentCleanupHelp,
} from "./commands/agent-session.js";
import {
  startWorkflow,
  listWorkflows,
  getWorkflowStatus,
  advanceWorkflow,
  approveWorkflowGate,
  formatWorkflowStatus,
  formatWorkflowList,
} from "./commands/workflow.js";
import { runMenuLoop } from "./menu/index.js";
import * as readline from "node:readline";
import { spawn } from "node:child_process";
import { join } from "node:path";

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

// Validator definitions
interface ValidatorDef {
  name: string;
  script: string;
  description: string;
}

const VALIDATORS: ValidatorDef[] = [
  { name: "links", script: "validate-links.mjs", description: "Bidirectional links" },
  { name: "adr-traceability", script: "validate-adr-traceability.mjs", description: "ADR traceability" },
  { name: "adr-staleness", script: "validate-adr-staleness.mjs", description: "ADR staleness" },
  { name: "source-adr-references", script: "validate-source-adr-references.mjs", description: "Source ADR refs" },
  { name: "design-doc-content", script: "validate-design-doc-content.mjs", description: "Design doc content" },
  { name: "request-staleness", script: "validate-request-staleness.mjs", description: "Request staleness" },
  { name: "request-completion", script: "validate-request-completion.mjs", description: "Request completion" },
  { name: "commit-traceability", script: "validate-commit-traceability.mjs", description: "Commit traceability" },
  { name: "complete-traceability", script: "validate-complete-traceability.mjs", description: "Complete traceability" },
  { name: "contract-coverage", script: "validate-contract-coverage.mjs", description: "Contract coverage" },
  { name: "test-coverage", script: "validate-test-coverage.mjs", description: "Test coverage" },
  { name: "chain-types", script: "validate-chain-types.mjs", description: "Chain type constraints" },
  { name: "agents-md", script: "validate-agents-md.mjs", description: "AGENTS.md presence" },
];

const ALL_VALIDATORS = VALIDATORS.map(v => v.script);
const QUICK_VALIDATORS = ["validate-links.mjs", "validate-agents-md.mjs"];
const CI_VALIDATORS = [
  "validate-links.mjs",
  "validate-adr-traceability.mjs",
  "validate-agents-md.mjs",
  "validate-chain-types.mjs",
  "validate-request-completion.mjs",
];

/**
 * Run a single validation script and stream output
 * @param scriptName - Name of the script in scripts/ directory
 * @returns Exit code from the script
 */
async function runValidator(scriptName: string): Promise<number> {
  const scriptPath = join(projectRoot, "scripts", scriptName);
  
  return new Promise((resolve) => {
    const child = spawn("node", [scriptPath], {
      cwd: projectRoot,
      stdio: "inherit",
    });

    child.on("error", (err) => {
      console.error(`Failed to run ${scriptName}: ${err.message}`);
      resolve(1);
    });

    child.on("close", (code) => {
      resolve(code ?? 1);
    });
  });
}

/**
 * Result from running a validator
 */
interface ValidatorResult {
  name: string;
  exitCode: number;
  hasWarnings: boolean;
}

/**
 * Run multiple validators and report summary
 * @param scripts - Array of script names to run
 * @returns Exit code (0 if all pass, 1 if any fail)
 */
async function runAllValidators(scripts: string[]): Promise<number> {
  const results: ValidatorResult[] = [];
  
  console.log("Running validators...\n");
  
  for (const script of scripts) {
    const validator = VALIDATORS.find(v => v.script === script);
    const name = validator?.name ?? script.replace("validate-", "").replace(".mjs", "");
    
    console.log(`\n${"─".repeat(60)}`);
    console.log(`Running: ${name}`);
    console.log("─".repeat(60));
    
    const exitCode = await runValidator(script);
    results.push({ name, exitCode, hasWarnings: false });
  }
  
  // Print summary
  console.log("\n" + "═".repeat(60));
  console.log("Validation Results:");
  console.log("═".repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  for (const result of results) {
    if (result.exitCode === 0) {
      console.log(`  ✅ ${result.name}`);
      passed++;
    } else {
      console.log(`  ❌ ${result.name}`);
      failed++;
    }
  }
  
  console.log("─".repeat(60));
  console.log(`${failed} failed, ${passed} passed`);
  
  return failed > 0 ? 1 : 0;
}

/**
 * Show incomplete work items
 */
async function showIncompleteWork(): Promise<void> {
  const { readdirSync, existsSync, statSync } = await import("node:fs");
  const { execSync } = await import("node:child_process");
  
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  
  console.log("Incomplete Work Items\n");
  console.log("═".repeat(60));
  
  // 1. TODOs/FIXMEs without CR/FR reference
  console.log("\n📝 TODOs/FIXMEs without CR/FR reference:");
  console.log("─".repeat(40));
  
  try {
    const grepResult = execSync(
      'grep -rn "TODO\\|FIXME" --include="*.ts" --include="*.mjs" packages/ scripts/ 2>/dev/null || true',
      { cwd: projectRoot, encoding: "utf-8" }
    );
    
    const lines = grepResult.split("\n").filter(Boolean);
    const untracked = lines.filter(line => !/(CR-|FR-)/.test(line));
    
    if (untracked.length === 0) {
      console.log("  None found ✓");
    } else {
      for (const line of untracked.slice(0, 10)) {
        console.log(`  ${line.slice(0, 80)}${line.length > 80 ? "..." : ""}`);
      }
      if (untracked.length > 10) {
        console.log(`  ... and ${untracked.length - 10} more`);
      }
    }
  } catch {
    console.log("  Unable to search for TODOs");
  }
  
  // 2. CRs/FRs in doing/ for >3 days
  console.log("\n📋 Stale requests (in doing/ > 3 days):");
  console.log("─".repeat(40));
  
  const requestDirs = [
    join(projectRoot, "docs/requests/change-requests/doing"),
    join(projectRoot, "docs/requests/fix-requests/doing"),
  ];
  
  let staleRequests = 0;
  for (const dir of requestDirs) {
    if (!existsSync(dir)) continue;
    
    const files = readdirSync(dir).filter(f => f.endsWith(".md"));
    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      const ageInDays = (now - stat.mtimeMs) / DAY_MS;
      
      if (ageInDays > 3) {
        console.log(`  ${file} (${Math.floor(ageInDays)} days)`);
        staleRequests++;
      }
    }
  }
  
  if (staleRequests === 0) {
    console.log("  None found ✓");
  }
  
  // 3. ADRs in doing/ for >7 days
  console.log("\n📐 Stale ADRs (in doing/ > 7 days):");
  console.log("─".repeat(40));
  
  const adrDoingDir = join(projectRoot, "docs/adr/doing");
  let staleADRs = 0;
  
  if (existsSync(adrDoingDir)) {
    const files = readdirSync(adrDoingDir).filter(f => f.endsWith(".md"));
    for (const file of files) {
      const filePath = join(adrDoingDir, file);
      const stat = statSync(filePath);
      const ageInDays = (now - stat.mtimeMs) / DAY_MS;
      
      if (ageInDays > 7) {
        console.log(`  ${file} (${Math.floor(ageInDays)} days)`);
        staleADRs++;
      }
    }
  }
  
  if (staleADRs === 0) {
    console.log("  None found ✓");
  }
  
  // 4. Tasks in todo/ for >7 days
  console.log("\n📌 Stale tasks (in todo/ > 7 days):");
  console.log("─".repeat(40));
  
  const tasksTodoDir = join(projectRoot, "docs/tasks/todo");
  let staleTasks = 0;
  
  if (existsSync(tasksTodoDir)) {
    const chains = readdirSync(tasksTodoDir, { withFileTypes: true })
      .filter(d => d.isDirectory());
    
    for (const chain of chains) {
      const chainDir = join(tasksTodoDir, chain.name);
      const files = readdirSync(chainDir).filter(f => f.endsWith(".md"));
      
      for (const file of files) {
        const filePath = join(chainDir, file);
        const stat = statSync(filePath);
        const ageInDays = (now - stat.mtimeMs) / DAY_MS;
        
        if (ageInDays > 7) {
          console.log(`  ${chain.name}/${file} (${Math.floor(ageInDays)} days)`);
          staleTasks++;
        }
      }
    }
  }
  
  if (staleTasks === 0) {
    console.log("  None found ✓");
  }
  
  console.log("\n" + "═".repeat(60));
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
const metricsCollector = new MetricsCollector(projectRoot);

/**
 * Parse tokens string in format "input,output" to TokenUsage
 */
function parseTokens(tokensStr: string): TokenUsage | undefined {
  const parts = tokensStr.split(",");
  if (parts.length !== 2) {
    return undefined;
  }
  const input = parseInt(parts[0], 10);
  const output = parseInt(parts[1], 10);
  if (isNaN(input) || isNaN(output)) {
    return undefined;
  }
  return { input, output };
}

/**
 * Emit a metrics event, gracefully handling errors
 */
async function emitEvent(
  event: Parameters<typeof metricsCollector.record>[0]
): Promise<void> {
  try {
    await metricsCollector.record(event);
  } catch {
    // Gracefully ignore metrics errors - don't fail the command
  }
}

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
      // Emit chain:created event
      await emitEvent({
        eventType: "chain:created",
        entityType: "chain",
        entityId: chain.id,
        requestId: chain.requestId,
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

  // Workflow lifecycle
  "workflow:start": {
    description: "Create and start a workflow from a template",
    usage: "workflow:start <request-id> [--template=standard]",
    handler: async (args) => {
      const positional: string[] = [];
      let template: string | undefined;

      for (const arg of args) {
        if (arg.startsWith("--template=")) {
          template = arg.slice("--template=".length);
        } else {
          positional.push(arg);
        }
      }

      const [requestId] = positional;
      if (!requestId) {
        console.error("Usage: choragen workflow:start <request-id> [--template=standard]");
        process.exit(1);
      }

      const result = await startWorkflow(projectRoot, requestId, { template });
      if (!result.success || !result.workflow) {
        console.error(result.error || "Failed to start workflow");
        process.exit(1);
      }

      console.log(`Created workflow: ${result.workflow.id}`);
      console.log(`Request: ${result.workflow.requestId}`);
      console.log(formatWorkflowStatus(result.workflow));
    },
  },

  "workflow:status": {
    description: "Show workflow status",
    usage: "workflow:status <workflow-id>",
    handler: async (args) => {
      const [workflowId] = args;
      if (!workflowId) {
        console.error("Usage: choragen workflow:status <workflow-id>");
        process.exit(1);
      }

      const result = await getWorkflowStatus(projectRoot, workflowId);
      if (!result.success || !result.workflow) {
        console.error(result.error || "Failed to get workflow status");
        process.exit(1);
      }

      console.log(formatWorkflowStatus(result.workflow));
    },
  },

  "workflow:list": {
    description: "List workflows",
    usage: "workflow:list [--status=active]",
    handler: async (args) => {
      let statusFilter: WorkflowStatus | undefined;
      for (const arg of args) {
        if (arg.startsWith("--status=")) {
          const value = arg.slice("--status=".length) as WorkflowStatus;
          if (!WORKFLOW_STATUSES.includes(value)) {
            console.error(`Invalid status: ${value}. Must be one of: ${WORKFLOW_STATUSES.join(", ")}`);
            process.exit(1);
          }
          statusFilter = value;
        }
      }

      const result = await listWorkflows(projectRoot, { status: statusFilter });
      if (!result.success) {
        console.error(result.error || "Failed to list workflows");
        process.exit(1);
      }

      console.log(formatWorkflowList(result.workflows));
    },
  },

  "workflow:advance": {
    description: "Advance workflow to next stage (gate must be satisfied)",
    usage: "workflow:advance <workflow-id>",
    handler: async (args) => {
      const [workflowId] = args;
      if (!workflowId) {
        console.error("Usage: choragen workflow:advance <workflow-id>");
        process.exit(1);
      }

      const result = await advanceWorkflow(projectRoot, workflowId);
      if (!result.success || !result.workflow) {
        console.error(result.error || "Failed to advance workflow");
        process.exit(1);
      }

      console.log(`Advanced workflow: ${result.workflow.id}`);
      console.log(formatWorkflowStatus(result.workflow));
    },
  },

  "workflow:approve": {
    description: "Approve human gate on current workflow stage",
    usage: "workflow:approve <workflow-id>",
    handler: async (args) => {
      const [workflowId] = args;
      if (!workflowId) {
        console.error("Usage: choragen workflow:approve <workflow-id>");
        process.exit(1);
      }

      const result = await approveWorkflowGate(projectRoot, workflowId);
      if (!result.success || !result.workflow) {
        console.error(result.error || "Failed to approve workflow gate");
        process.exit(1);
      }

      console.log(`Approved gate for workflow: ${result.workflow.id}`);
      console.log(formatWorkflowStatus(result.workflow));
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

      // Verify chain exists
      const chain = await chainManager.getChain(chainId);
      if (!chain) {
        console.error(`Chain not found: ${chainId}`);
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

      // Emit task:started event
      await emitEvent({
        eventType: "task:started",
        entityType: "task",
        entityId: taskId,
        chainId,
      });

      console.log(`Started task: ${result.task.id}`);
      console.log(`  ${result.previousStatus} → ${result.newStatus}`);
    },
  },

  "task:complete": {
    description: "Complete a task (move to in-review)",
    usage: "task:complete <chain-id> <task-id> [--tokens <input>,<output>] [--model <name>]",
    handler: async (args) => {
      // Parse flags from args
      const positionalArgs: string[] = [];
      let tokensStr: string | undefined;
      let model: string | undefined;

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--tokens" && args[i + 1]) {
          tokensStr = args[++i];
        } else if (arg.startsWith("--tokens=")) {
          tokensStr = arg.slice("--tokens=".length);
        } else if (arg === "--model" && args[i + 1]) {
          model = args[++i];
        } else if (arg.startsWith("--model=")) {
          model = arg.slice("--model=".length);
        } else {
          positionalArgs.push(arg);
        }
      }

      const [chainId, taskId] = positionalArgs;
      if (!chainId || !taskId) {
        console.error("Usage: choragen task:complete <chain-id> <task-id> [--tokens <input>,<output>] [--model <name>]");
        process.exit(1);
      }

      // Parse tokens if provided
      const tokens = tokensStr ? parseTokens(tokensStr) : undefined;
      if (tokensStr && !tokens) {
        console.error("Invalid --tokens format. Expected: <input>,<output> (e.g., 5000,2000)");
        process.exit(1);
      }

      const result = await taskManager.completeTask(chainId, taskId);
      if (!result.success) {
        console.error(`Failed to complete task: ${result.error}`);
        process.exit(1);
      }

      // Emit task:completed event
      await emitEvent({
        eventType: "task:completed",
        entityType: "task",
        entityId: taskId,
        chainId,
        model,
        tokens,
      });

      console.log(`Completed task: ${result.task.id}`);
      console.log(`  ${result.previousStatus} → ${result.newStatus}`);
      if (tokens) {
        console.log(`  Tokens: ${tokens.input} input, ${tokens.output} output`);
      }
      if (model) {
        console.log(`  Model: ${model}`);
      }
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
    description: "Create a rework task for a completed/in-review task",
    usage: "task:rework <chain-id> <task-id> --reason \"...\"",
    handler: async (args) => {
      // Parse args for --reason flag
      const positionalArgs: string[] = [];
      let reason: string | undefined;

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--reason" && args[i + 1]) {
          reason = args[++i];
        } else if (arg.startsWith("--reason=")) {
          reason = arg.slice("--reason=".length);
        } else {
          positionalArgs.push(arg);
        }
      }

      const [chainId, taskId] = positionalArgs;
      if (!chainId || !taskId) {
        console.error("Usage: choragen task:rework <chain-id> <task-id> --reason \"...\"");
        process.exit(1);
      }

      if (!reason) {
        console.error("Error: --reason is required");
        console.error("Usage: choragen task:rework <chain-id> <task-id> --reason \"Description of what needs fixing\"");
        process.exit(1);
      }

      const result = await createReworkTask(projectRoot, {
        chainId,
        taskId,
        reason,
      });

      if (result.success) {
        // Emit task:rework event
        await emitEvent({
          eventType: "task:rework",
          entityType: "task",
          entityId: result.reworkTask!.id,
          chainId,
          metadata: {
            originalTaskId: taskId,
          },
        });
      }

      console.log(formatReworkResult(result));

      if (!result.success) {
        process.exit(1);
      }
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
      console.log(`Tasks for ${chainId}:\n`);
      for (const task of tasks) {
        // Build rework indicator
        let reworkIndicator = "";
        if (task.reworkOf) {
          // This is a rework task
          reworkIndicator = `  [rework of: ${task.reworkOf}]`;
        } else if (task.reworkCount && task.reworkCount > 0) {
          // Original task that has been reworked
          reworkIndicator = `  [reworked: ${task.reworkCount}]`;
        }
        console.log(`  ${task.id.padEnd(40)} ${task.status.padEnd(12)}${reworkIndicator}`);
      }
    },
  },

  "task:status": {
    description: "Show detailed status for a task",
    usage: "task:status <chain-id> <task-id>",
    handler: async (args) => {
      const [chainId, taskId] = args;
      if (!chainId || !taskId) {
        console.error("Usage: choragen task:status <chain-id> <task-id>");
        process.exit(1);
      }
      const task = await taskManager.getTask(chainId, taskId);
      if (!task) {
        console.error(`Task not found: ${taskId} in chain ${chainId}`);
        process.exit(1);
      }

      // Display task info
      const isRework = !!task.reworkOf;
      const titleSuffix = isRework ? " (Rework)" : "";
      console.log(`Task: ${task.id}${titleSuffix}`);
      console.log(`Status: ${task.status}`);
      console.log(`Title: ${task.title}`);

      // Show rework relationship info
      if (task.reworkOf) {
        console.log(`Rework Of: ${task.reworkOf}`);
        if (task.reworkReason) {
          console.log(`Rework Reason: ${task.reworkReason}`);
        }
      } else if (task.reworkCount && task.reworkCount > 0) {
        console.log(`Rework Count: ${task.reworkCount}`);
        // Find rework tasks for this original task
        const allTasks = await taskManager.getTasksForChain(chainId);
        const reworkTasks = allTasks.filter((t) => t.reworkOf === task.id);
        if (reworkTasks.length > 0) {
          console.log("Rework Tasks:");
          for (const rt of reworkTasks) {
            console.log(`  - ${rt.id} (${rt.status})`);
          }
        }
      }

      if (task.description) {
        console.log(`Description: ${task.description.slice(0, 200)}${task.description.length > 200 ? "..." : ""}`);
      }
    },
  },

  // Governance
  "governance:check": {
    description: "Check files against governance rules",
    usage: "governance:check [--role <impl|control>] <action> <file1> [file2...]",
    handler: async (args) => {
      // Parse --role flag
      let role: AgentRole | undefined;
      const remainingArgs: string[] = [];

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--role" && args[i + 1]) {
          const roleValue = args[++i];
          if (roleValue !== "impl" && roleValue !== "control") {
            console.error(`Invalid role: ${roleValue}. Must be one of: impl, control`);
            process.exit(1);
          }
          role = roleValue;
        } else if (arg.startsWith("--role=")) {
          const roleValue = arg.slice("--role=".length);
          if (roleValue !== "impl" && roleValue !== "control") {
            console.error(`Invalid role: ${roleValue}. Must be one of: impl, control`);
            process.exit(1);
          }
          role = roleValue;
        } else {
          remainingArgs.push(arg);
        }
      }

      const [action, ...files] = remainingArgs;
      if (!action || files.length === 0) {
        console.error(
          "Usage: choragen governance:check [--role <impl|control>] <create|modify|delete|move> <file1> [file2...]"
        );
        process.exit(1);
      }

      if (!["create", "modify", "delete", "move"].includes(action)) {
        console.error("Action must be one of: create, modify, delete, move");
        process.exit(1);
      }

      const schema = await parseGovernanceFile("choragen.governance.yaml");

      // Use role-based check if role specified, otherwise use global check
      if (role) {
        const results = files.map((file) =>
          checkMutationForRole(file, action as "create" | "modify" | "delete", role, schema)
        );

        const allowed = results.filter((r) => r.policy === "allow");
        const denied = results.filter((r) => r.policy === "deny");

        // Format output
        if (denied.length === 0) {
          console.log(`✓ All mutations allowed for role: ${role}`);
        } else {
          console.log(`✗ Denied mutations for role: ${role}`);
          for (const result of denied) {
            console.log(`  - ${result.file} (${result.action})`);
            if (result.reason) {
              console.log(`    Reason: ${result.reason}`);
            }
          }
          if (allowed.length > 0) {
            console.log(`\n✓ ${allowed.length} mutation(s) allowed`);
          }
          process.exit(1);
        }
      } else {
        // Existing global check
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

  // Document creation
  "cr:new": {
    description: "Create a new Change Request",
    usage: "cr:new <slug> [title] [--domain=<domain>]",
    handler: async (args) => {
      const positionalArgs: string[] = [];
      let domain: string | undefined;

      for (const arg of args) {
        if (arg.startsWith("--domain=")) {
          domain = arg.slice("--domain=".length);
        } else {
          positionalArgs.push(arg);
        }
      }

      const [slug, ...titleParts] = positionalArgs;
      if (!slug) {
        console.error("Usage: choragen cr:new <slug> [title] [--domain=<domain>]");
        process.exit(1);
      }

      const title = titleParts.length > 0 ? titleParts.join(" ") : undefined;
      const result = await createCR(projectRoot, { slug, title, domain });
      console.log(formatCreateResult(result, "Change Request"));

      if (!result.success) {
        process.exit(1);
      }
    },
  },

  "cr:close": {
    description: "Close a Change Request (move to done)",
    usage: "cr:close <cr-id>",
    handler: async (args) => {
      const [crId] = args;
      if (!crId) {
        console.error("Usage: choragen cr:close <cr-id>");
        process.exit(1);
      }

      const result = await closeCR(projectRoot, crId);
      if (result.success) {
        console.log(`✓ Closed CR: ${result.id}`);
        console.log(`  Moved to: ${result.filePath}`);
      } else {
        console.error(`❌ Failed to close CR: ${result.error}`);
        process.exit(1);
      }
    },
  },

  "request:close": {
    description: "Close a request (CR or FR) with commit history",
    usage: "request:close <request-id>",
    handler: async (args) => {
      const [requestId] = args;
      if (!requestId) {
        console.error("Usage: choragen request:close <request-id>");
        process.exit(1);
      }

      console.log(`Closing ${requestId}...`);

      const result = await closeRequest(projectRoot, requestId);
      if (result.success) {
        // Emit request:closed event
        await emitEvent({
          eventType: "request:closed",
          entityType: "request",
          entityId: requestId,
        });

        console.log(`  Found ${result.commits!.length} commits:`);
        for (const commit of result.commits!) {
          console.log(`    ${commit}`);
        }
        console.log(`  Updated ## Commits section`);
        console.log(`  Moved to ${result.filePath}`);
        console.log(`✅ Request closed`);
      } else {
        console.error(`Error: ${result.error}`);
        process.exit(1);
      }
    },
  },

  "fr:new": {
    description: "Create a new Fix Request",
    usage: "fr:new <slug> [title] [--domain=<domain>] [--severity=high|medium|low]",
    handler: async (args) => {
      const positionalArgs: string[] = [];
      let domain: string | undefined;
      let severity: "high" | "medium" | "low" | undefined;

      for (const arg of args) {
        if (arg.startsWith("--domain=")) {
          domain = arg.slice("--domain=".length);
        } else if (arg.startsWith("--severity=")) {
          const sev = arg.slice("--severity=".length);
          if (sev === "high" || sev === "medium" || sev === "low") {
            severity = sev;
          } else {
            console.error("Severity must be one of: high, medium, low");
            process.exit(1);
          }
        } else {
          positionalArgs.push(arg);
        }
      }

      const [slug, ...titleParts] = positionalArgs;
      if (!slug) {
        console.error("Usage: choragen fr:new <slug> [title] [--domain=<domain>] [--severity=high|medium|low]");
        process.exit(1);
      }

      const title = titleParts.length > 0 ? titleParts.join(" ") : undefined;
      const result = await createFR(projectRoot, { slug, title, domain, severity });
      console.log(formatCreateResult(result, "Fix Request"));

      if (!result.success) {
        process.exit(1);
      }
    },
  },

  "adr:new": {
    description: "Create a new Architecture Decision Record",
    usage: "adr:new <slug> [title] [--linked=<cr-or-fr-id>]",
    handler: async (args) => {
      const positionalArgs: string[] = [];
      let linkedRequest: string | undefined;

      for (const arg of args) {
        if (arg.startsWith("--linked=")) {
          linkedRequest = arg.slice("--linked=".length);
        } else {
          positionalArgs.push(arg);
        }
      }

      const [slug, ...titleParts] = positionalArgs;
      if (!slug) {
        console.error("Usage: choragen adr:new <slug> [title] [--linked=<cr-or-fr-id>]");
        process.exit(1);
      }

      const title = titleParts.length > 0 ? titleParts.join(" ") : undefined;
      const result = await createADR(projectRoot, { slug, title, linkedRequest });
      console.log(formatCreateResult(result, "ADR"));

      if (!result.success) {
        process.exit(1);
      }
    },
  },

  "adr:archive": {
    description: "Archive an ADR (move to archive/YYYY-MM/)",
    usage: "adr:archive <adr-file-or-id>",
    handler: async (args) => {
      const [adrFile] = args;
      if (!adrFile) {
        console.error("Usage: choragen adr:archive <adr-file-or-id>");
        process.exit(1);
      }

      const result = await archiveADR(projectRoot, adrFile);
      if (result.success) {
        console.log(`✓ Archived ADR: ${result.id}`);
        console.log(`  Moved to: ${result.filePath}`);
      } else {
        console.error(`❌ Failed to archive ADR: ${result.error}`);
        process.exit(1);
      }
    },
  },

  "design:new": {
    description: "Create a new design document",
    usage: "design:new <type> <slug> [title] [--domain=<domain>]\n" +
           "                         Types: persona, scenario, use-case, feature, enhancement",
    handler: async (args) => {
      const positionalArgs: string[] = [];
      let domain: string | undefined;

      for (const arg of args) {
        if (arg.startsWith("--domain=")) {
          domain = arg.slice("--domain=".length);
        } else {
          positionalArgs.push(arg);
        }
      }

      const [type, slug, ...titleParts] = positionalArgs;
      if (!type || !slug) {
        console.error("Usage: choragen design:new <type> <slug> [title] [--domain=<domain>]");
        console.error(`  Types: ${DESIGN_TYPES.join(", ")}`);
        process.exit(1);
      }

      if (!DESIGN_TYPES.includes(type as DesignType)) {
        console.error(`Invalid type: ${type}`);
        console.error(`  Valid types: ${DESIGN_TYPES.join(", ")}`);
        process.exit(1);
      }

      const title = titleParts.length > 0 ? titleParts.join(" ") : undefined;
      const result = await createDesignDoc(projectRoot, type as DesignType, { slug, title, domain });
      
      // Capitalize type for display
      const typeDisplay = type.charAt(0).toUpperCase() + type.slice(1);
      console.log(formatCreateResult(result, `${typeDisplay} Document`));

      if (!result.success) {
        process.exit(1);
      }
    },
  },

  // Validation commands
  "validate:links": {
    description: "Validate bidirectional links between docs and implementation",
    handler: async () => {
      const exitCode = await runValidator("validate-links.mjs");
      process.exit(exitCode);
    },
  },

  "validate:adr-traceability": {
    description: "Validate ADR links to CR/FR and design docs",
    handler: async () => {
      const exitCode = await runValidator("validate-adr-traceability.mjs");
      process.exit(exitCode);
    },
  },

  "validate:adr-staleness": {
    description: "Check for stale ADRs in doing/ status",
    handler: async () => {
      const exitCode = await runValidator("validate-adr-staleness.mjs");
      process.exit(exitCode);
    },
  },

  "validate:source-adr-references": {
    description: "Validate source files reference their governing ADRs",
    handler: async () => {
      const exitCode = await runValidator("validate-source-adr-references.mjs");
      process.exit(exitCode);
    },
  },

  "validate:design-doc-content": {
    description: "Validate design document structure and content",
    handler: async () => {
      const exitCode = await runValidator("validate-design-doc-content.mjs");
      process.exit(exitCode);
    },
  },

  "validate:request-staleness": {
    description: "Check for stale CRs/FRs in doing/ status",
    handler: async () => {
      const exitCode = await runValidator("validate-request-staleness.mjs");
      process.exit(exitCode);
    },
  },

  "validate:request-completion": {
    description: "Validate completed requests have required fields",
    handler: async () => {
      const exitCode = await runValidator("validate-request-completion.mjs");
      process.exit(exitCode);
    },
  },

  "validate:commit-traceability": {
    description: "Validate commits reference CR/FR IDs",
    handler: async () => {
      const exitCode = await runValidator("validate-commit-traceability.mjs");
      process.exit(exitCode);
    },
  },

  "validate:complete-traceability": {
    description: "Validate complete traceability chain",
    handler: async () => {
      const exitCode = await runValidator("validate-complete-traceability.mjs");
      process.exit(exitCode);
    },
  },

  "validate:contract-coverage": {
    description: "Validate contract coverage for API endpoints",
    handler: async () => {
      const exitCode = await runValidator("validate-contract-coverage.mjs");
      process.exit(exitCode);
    },
  },

  "validate:test-coverage": {
    description: "Validate test coverage requirements",
    handler: async () => {
      const exitCode = await runValidator("validate-test-coverage.mjs");
      process.exit(exitCode);
    },
  },

  "validate:chain-types": {
    description: "Validate chain type constraints (design before impl)",
    handler: async () => {
      const exitCode = await runValidator("validate-chain-types.mjs");
      process.exit(exitCode);
    },
  },

  "validate:agents-md": {
    description: "Validate AGENTS.md presence in key directories",
    handler: async () => {
      const exitCode = await runValidator("validate-agents-md.mjs");
      process.exit(exitCode);
    },
  },

  "validate:all": {
    description: "Run all validators and report summary",
    handler: async () => {
      const exitCode = await runAllValidators(ALL_VALIDATORS);
      process.exit(exitCode);
    },
  },

  "validate:quick": {
    description: "Run fast validators only (links, agents-md)",
    handler: async () => {
      const exitCode = await runAllValidators(QUICK_VALIDATORS);
      process.exit(exitCode);
    },
  },

  "validate:ci": {
    description: "Run CI-appropriate validators (all blocking ones)",
    handler: async () => {
      const exitCode = await runAllValidators(CI_VALIDATORS);
      process.exit(exitCode);
    },
  },

  // Utility commands
  "work:incomplete": {
    description: "List incomplete work items (stale requests, tasks, TODOs)",
    handler: async () => {
      await showIncompleteWork();
    },
  },

  // Metrics commands
  "metrics:export": {
    description: "Export metrics data for external analysis",
    usage: "metrics:export --format <json|csv> [--output <file>] [--since <duration>]",
    handler: async (args) => {
      let format: "json" | "csv" = "json";
      let output: string | undefined;
      let since: string | undefined;

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--format" && args[i + 1]) {
          const fmt = args[++i];
          if (fmt !== "json" && fmt !== "csv") {
            console.error("Format must be 'json' or 'csv'");
            process.exit(1);
          }
          format = fmt;
        } else if (arg.startsWith("--format=")) {
          const fmt = arg.slice("--format=".length);
          if (fmt !== "json" && fmt !== "csv") {
            console.error("Format must be 'json' or 'csv'");
            process.exit(1);
          }
          format = fmt as "json" | "csv";
        } else if (arg === "--output" && args[i + 1]) {
          output = args[++i];
        } else if (arg.startsWith("--output=")) {
          output = arg.slice("--output=".length);
        } else if (arg === "--since" && args[i + 1]) {
          since = args[++i];
        } else if (arg.startsWith("--since=")) {
          since = arg.slice("--since=".length);
        }
      }

      try {
        const content = await exportMetrics(projectRoot, { format, output, since });
        await writeExport(content, output);

        // Print confirmation if writing to file
        if (output) {
          console.error(`Exported metrics to ${output}`);
        }
      } catch (error) {
        console.error(`Failed to export metrics: ${(error as Error).message}`);
        process.exit(1);
      }
    },
  },

  "metrics:summary": {
    description: "Display pipeline metrics summary",
    usage: "metrics:summary [--since <duration>] [--chain <id>] [--json]",
    handler: async (args) => {
      let since: string | undefined;
      let chainId: string | undefined;
      let jsonOutput = false;

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--since" && args[i + 1]) {
          since = args[++i];
        } else if (arg.startsWith("--since=")) {
          since = arg.slice("--since=".length);
        } else if (arg === "--chain" && args[i + 1]) {
          chainId = args[++i];
        } else if (arg.startsWith("--chain=")) {
          chainId = arg.slice("--chain=".length);
        } else if (arg === "--json") {
          jsonOutput = true;
        }
      }

      try {
        const summary = await getMetricsSummary(projectRoot, { since, chainId });
        if (jsonOutput) {
          console.log(formatMetricsSummaryJson(summary));
        } else {
          console.log(formatMetricsSummary(summary));
        }
      } catch (error) {
        console.error(`Failed to get metrics: ${(error as Error).message}`);
        process.exit(1);
      }
    },
  },

  "metrics:import": {
    description: "Import historical metrics from git history",
    usage: "metrics:import [--since <date>] [--dry-run]",
    handler: async (args) => {
      let since: string | undefined;
      let dryRun = false;

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--since" && args[i + 1]) {
          since = args[++i];
        } else if (arg.startsWith("--since=")) {
          since = arg.slice("--since=".length);
        } else if (arg === "--dry-run") {
          dryRun = true;
        }
      }

      try {
        const summary = await importMetrics(projectRoot, { since, dryRun });
        console.log(formatImportSummary(summary, dryRun));
      } catch (error) {
        console.error(`Failed to import metrics: ${(error as Error).message}`);
        process.exit(1);
      }
    },
  },

  // Traceability
  trace: {
    description: "Trace artifact traceability chain",
    usage: "trace <artifact-path-or-id> [--format=tree|json|markdown] [--direction=both|upstream|downstream] [--depth=<n>] [--no-color]",
    handler: async (args) => {
      // Handle --help
      if (args.includes("--help") || args.includes("-h")) {
        console.log(formatTraceHelp());
        return;
      }

      // Parse arguments
      const positionalArgs: string[] = [];
      let format: string | undefined;
      let direction: string | undefined;
      let depth: number | undefined;
      let noColor = false;

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith("--format=")) {
          format = arg.slice("--format=".length);
        } else if (arg === "--format" && args[i + 1]) {
          format = args[++i];
        } else if (arg.startsWith("--direction=")) {
          direction = arg.slice("--direction=".length);
        } else if (arg === "--direction" && args[i + 1]) {
          direction = args[++i];
        } else if (arg.startsWith("--depth=")) {
          const depthStr = arg.slice("--depth=".length);
          depth = parseInt(depthStr, 10);
          if (isNaN(depth)) {
            console.error(`Invalid depth value: ${depthStr}`);
            process.exit(1);
          }
        } else if (arg === "--depth" && args[i + 1]) {
          depth = parseInt(args[++i], 10);
          if (isNaN(depth)) {
            console.error(`Invalid depth value: ${args[i]}`);
            process.exit(1);
          }
        } else if (arg === "--no-color") {
          noColor = true;
        } else if (!arg.startsWith("-")) {
          positionalArgs.push(arg);
        }
      }

      // Require artifact path or ID
      const artifactPathOrId = positionalArgs[0];
      if (!artifactPathOrId) {
        console.error("Error: Missing artifact path or ID");
        console.error("Usage: choragen trace <artifact-path-or-id> [options]");
        console.error("Run 'choragen trace --help' for more information.");
        process.exit(1);
      }

      // Run trace
      const result = await runTrace(projectRoot, artifactPathOrId, {
        format,
        direction,
        depth,
        noColor,
      });

      if (result.success) {
        console.log(result.output);
      } else {
        console.error(`Error: ${result.error}`);
        process.exit(1);
      }
    },
  },

  // Session management
  "session:start": {
    description: "Start a session with a role",
    usage: "session:start <impl|control> [--task <path>]",
    handler: async (args) => {
      // Parse args
      const positionalArgs: string[] = [];
      let task: string | undefined;

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--task" && args[i + 1]) {
          task = args[++i];
        } else if (arg.startsWith("--task=")) {
          task = arg.slice("--task=".length);
        } else {
          positionalArgs.push(arg);
        }
      }

      const [role] = positionalArgs;
      if (!role) {
        console.error("Usage: choragen session:start <impl|control> [--task <path>]");
        process.exit(1);
      }

      if (role !== "impl" && role !== "control") {
        console.error(`Invalid role: ${role}. Must be 'impl' or 'control'.`);
        process.exit(1);
      }

      const result = startSession(projectRoot, role as SessionRole, task);
      if (!result.success) {
        console.error(`Failed to start session: ${result.error}`);
        process.exit(1);
      }

      console.log(`Session started`);
      console.log(`  Role: ${result.session!.role}`);
      if (result.session!.task) {
        console.log(`  Task: ${result.session!.task}`);
      }
      console.log(`  Started: ${result.session!.started}`);
    },
  },

  "session:status": {
    description: "Show current session status",
    handler: async () => {
      const result = getSessionStatus(projectRoot);
      if (!result.success) {
        console.error(`Failed to get session status: ${result.error}`);
        process.exit(1);
      }

      console.log(formatSessionStatus(result.session));
    },
  },

  "session:end": {
    description: "End the current session",
    handler: async () => {
      const result = endSession(projectRoot);
      if (!result.success) {
        console.error(`Failed to end session: ${result.error}`);
        process.exit(1);
      }

      console.log("Session ended");
    },
  },

  // Agent runtime
  agent: {
    description: "Launch interactive agent menu",
    usage: "agent",
    handler: async () => {
      await runMenuLoop({ workspaceRoot: projectRoot });
    },
  },

  "agent:start": {
    description: "Start an agent session",
    usage: "agent:start --role=<impl|control> [--provider=<name>] [--model=<name>] [--chain=<id>] [--task=<id>] [--dry-run]",
    handler: async (args) => {
      // Handle --help
      if (args.includes("--help") || args.includes("-h")) {
        console.log(getAgentStartHelp());
        return;
      }
      await runAgentStart(args, projectRoot);
    },
  },

  "agent:resume": {
    description: "Resume a paused or failed agent session",
    usage: "agent:resume <session-id> [--json]",
    handler: async (args) => {
      if (args.includes("--help") || args.includes("-h")) {
        console.log(getAgentResumeHelp());
        return;
      }
      await runAgentResume(args, projectRoot);
    },
  },

  "agent:list-sessions": {
    description: "List all agent sessions",
    usage: "agent:list-sessions [--status=<status>] [--limit=<n>] [--json]",
    handler: async (args) => {
      if (args.includes("--help") || args.includes("-h")) {
        console.log(getAgentListSessionsHelp());
        return;
      }
      await runAgentListSessions(args, projectRoot);
    },
  },

  "agent:cleanup": {
    description: "Remove old session files",
    usage: "agent:cleanup [--older-than=<days>] [--dry-run] [--json]",
    handler: async (args) => {
      if (args.includes("--help") || args.includes("-h")) {
        console.log(getAgentCleanupHelp());
        return;
      }
      await runAgentCleanup(args, projectRoot);
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
        console.log(`  ${cmd.padEnd(30)} ${def.description}`);
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
