// ADR: ADR-011-workflow-orchestration

/**
 * Workflow CLI helpers
 *
 * These functions wrap WorkflowManager to provide CLI-friendly output for:
 * - Starting workflows from templates
 * - Listing workflows
 * - Showing workflow status
 * - Advancing stages
 * - Approving human gates
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import {
  WorkflowManager,
  loadTemplate,
  type WorkflowStatus,
  type Workflow,
  type WorkflowTemplate,
} from "@choragen/core";

export interface StartWorkflowOptions {
  template?: string;
}

export interface StartWorkflowResult {
  success: boolean;
  workflow?: Workflow;
  error?: string;
}

export interface ListWorkflowOptions {
  status?: WorkflowStatus;
}

export interface ListWorkflowResult {
  success: boolean;
  workflows: Workflow[];
  error?: string;
}

export interface WorkflowStatusResult {
  success: boolean;
  workflow?: Workflow;
  error?: string;
  formatted?: string;
}

export interface AdvanceWorkflowResult {
  success: boolean;
  workflow?: Workflow;
  error?: string;
}

export interface ApproveWorkflowResult {
  success: boolean;
  workflow?: Workflow;
  error?: string;
}

const REQUEST_DIRS = [
  "docs/requests/change-requests",
  "docs/requests/fix-requests",
];

const REQUEST_STATUSES = ["todo", "doing", "done"];

/**
 * Ensure the request ID exists in docs/requests/*
 */
async function requestExists(projectRoot: string, requestId: string): Promise<boolean> {
  for (const baseDir of REQUEST_DIRS) {
    for (const status of REQUEST_STATUSES) {
      const dir = path.join(projectRoot, baseDir, status);
      try {
        const files = await fs.readdir(dir);
        if (files.some((f) => f.startsWith(requestId))) {
          return true;
        }
      } catch {
        // Directory missing, continue
      }
    }
  }
  return false;
}

/**
 * Start a workflow using a template name
 */
export async function startWorkflow(
  projectRoot: string,
  requestId: string,
  options: StartWorkflowOptions = {}
): Promise<StartWorkflowResult> {
  const exists = await requestExists(projectRoot, requestId);
  if (!exists) {
    return { success: false, error: `Request not found: ${requestId}` };
  }

  const templateName = options.template || "standard";
  let template: WorkflowTemplate;
  try {
    template = await loadTemplate(projectRoot, templateName);
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }

  const manager = new WorkflowManager(projectRoot);
  const workflow = await manager.create({
    requestId,
    template,
  });

  return { success: true, workflow };
}

/**
 * List workflows with optional status filter
 */
export async function listWorkflows(
  projectRoot: string,
  options: ListWorkflowOptions = {}
): Promise<ListWorkflowResult> {
  const manager = new WorkflowManager(projectRoot);
  const workflows = await manager.list({
    status: options.status,
  });

  return { success: true, workflows };
}

/**
 * Get workflow status
 */
export async function getWorkflowStatus(
  projectRoot: string,
  workflowId: string
): Promise<WorkflowStatusResult> {
  const manager = new WorkflowManager(projectRoot);
  const workflow = await manager.get(workflowId);
  if (!workflow) {
    return { success: false, error: `Workflow not found: ${workflowId}` };
  }

  return {
    success: true,
    workflow,
    formatted: formatWorkflowStatus(workflow),
  };
}

/**
 * Advance workflow to the next stage (if gate satisfied)
 */
export async function advanceWorkflow(
  projectRoot: string,
  workflowId: string
): Promise<AdvanceWorkflowResult> {
  const manager = new WorkflowManager(projectRoot);
  try {
    const workflow = await manager.advance(workflowId);
    return { success: true, workflow };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Approve human gate for the current stage
 */
export async function approveWorkflowGate(
  projectRoot: string,
  workflowId: string
): Promise<ApproveWorkflowResult> {
  const manager = new WorkflowManager(projectRoot);
  const workflow = await manager.get(workflowId);
  if (!workflow) {
    return { success: false, error: `Workflow not found: ${workflowId}` };
  }

  const stage = workflow.stages[workflow.currentStage];
  if (stage.gate.type !== "human_approval") {
    return { success: false, error: `Current stage gate is ${stage.gate.type}, not human_approval` };
  }

  try {
    const updated = await manager.satisfyGate(workflowId, workflow.currentStage, "cli");
    return { success: true, workflow: updated };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Format workflow status for CLI output
 */
export function formatWorkflowStatus(workflow: Workflow): string {
  const lines: string[] = [];
  const totalStages = workflow.stages.length;
  const currentIdx = workflow.currentStage;
  const currentStage = workflow.stages[currentIdx];

  lines.push(`Workflow: ${workflow.id} (${workflow.status})`);
  lines.push(`Request: ${workflow.requestId}`);
  lines.push(`Stage: ${currentStage.name} (${currentStage.type})`);
  lines.push(`Progress: Stage ${currentIdx + 1} of ${totalStages}`);
  lines.push(`Gate: ${currentStage.gate.type} - ${currentStage.gate.satisfied ? "satisfied" : "pending"}`);
  if (currentStage.gate.prompt) {
    lines.push(`Prompt: ${currentStage.gate.prompt}`);
  }
  if (currentStage.gate.chainId) {
    lines.push(`Gate chain: ${currentStage.gate.chainId}`);
  }
  if (currentStage.gate.commands && currentStage.gate.commands.length > 0) {
    lines.push(`Commands: ${currentStage.gate.commands.join(", ")}`);
  }

  const recent = workflow.messages.slice(-5);
  if (recent.length > 0) {
    lines.push("Messages:");
    for (const msg of recent) {
      lines.push(`  [${msg.role}] ${msg.content}`);
    }
  } else {
    lines.push("Messages: (none)");
  }

  return lines.join("\n");
}

/**
 * Format workflow list for CLI output
 */
export function formatWorkflowList(workflows: Workflow[]): string {
  if (workflows.length === 0) return "No workflows found";

  const lines: string[] = [];
  for (const wf of workflows) {
    const stage = wf.stages[wf.currentStage];
    lines.push(
      `${wf.id} | ${wf.status} | ${wf.requestId} | Stage ${wf.currentStage + 1}/${wf.stages.length}: ${stage.name} (${stage.type})`
    );
  }
  return lines.join("\n");
}
