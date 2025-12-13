/**
 * Workflow persistence utilities
 *
 * Handles reading/writing workflow state and workflow index files.
 *
 * ADR: ADR-011-workflow-orchestration
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { Workflow, WorkflowStage, StageGate, WorkflowMessage, WorkflowStatus } from "./types.js";

/** Default relative paths for workflow persistence */
export const WORKFLOW_STORAGE = {
  baseDir: ".choragen",
  workflowsDir: ".choragen/workflows",
  indexFile: ".choragen/workflow-index.json",
} as const;

/**
 * A minimal index entry for quick listing/filtering without loading all workflows.
 */
export interface WorkflowIndexEntry {
  id: string;
  requestId: string;
  status: WorkflowStatus;
  template: string;
  currentStage: number;
  updatedAt: string;
}

/**
 * Workflow index structure
 */
export interface WorkflowIndex {
  lastSequence: number;
  lastDate: string;
  workflows: Record<string, WorkflowIndexEntry>;
}

const DEFAULT_INDEX: WorkflowIndex = {
  lastSequence: 0,
  lastDate: "",
  workflows: {},
};

interface PersistedWorkflow extends Omit<Workflow, "createdAt" | "updatedAt" | "stages" | "messages"> {
  createdAt: string;
  updatedAt: string;
  stages: PersistedWorkflowStage[];
  messages: PersistedWorkflowMessage[];
}

interface PersistedWorkflowStage extends Omit<WorkflowStage, "startedAt" | "completedAt" | "gate"> {
  startedAt?: string;
  completedAt?: string;
  gate: PersistedStageGate;
}

interface PersistedStageGate extends Omit<StageGate, "satisfiedAt"> {
  satisfiedAt?: string;
}

interface PersistedWorkflowMessage extends Omit<WorkflowMessage, "timestamp"> {
  timestamp: string;
}

/**
 * Get the workflow directory path
 */
export function getWorkflowsDir(projectRoot: string): string {
  return path.join(projectRoot, WORKFLOW_STORAGE.workflowsDir);
}

/**
 * Get the workflow index file path
 */
export function getWorkflowIndexPath(projectRoot: string): string {
  return path.join(projectRoot, WORKFLOW_STORAGE.indexFile);
}

/**
 * Get the workflow file path for a given workflow ID
 */
export function getWorkflowFilePath(projectRoot: string, workflowId: string): string {
  return path.join(getWorkflowsDir(projectRoot), `${workflowId}.json`);
}

/**
 * Ensure the workflow directories exist
 */
export async function ensureWorkflowDirs(projectRoot: string): Promise<void> {
  await fs.mkdir(getWorkflowsDir(projectRoot), { recursive: true });
}

/**
 * Load the workflow index (creates a default index if missing)
 */
export async function loadWorkflowIndex(projectRoot: string): Promise<WorkflowIndex> {
  const indexPath = getWorkflowIndexPath(projectRoot);
  try {
    const content = await fs.readFile(indexPath, "utf-8");
    return JSON.parse(content) as WorkflowIndex;
  } catch {
    return { ...DEFAULT_INDEX };
  }
}

/**
 * Persist the workflow index to disk
 */
export async function saveWorkflowIndex(projectRoot: string, index: WorkflowIndex): Promise<void> {
  await fs.mkdir(path.dirname(getWorkflowIndexPath(projectRoot)), { recursive: true });
  await fs.writeFile(
    getWorkflowIndexPath(projectRoot),
    JSON.stringify(index, null, 2),
    "utf-8"
  );
}

/**
 * Load a workflow by ID
 */
export async function loadWorkflow(projectRoot: string, workflowId: string): Promise<Workflow | null> {
  const workflowPath = getWorkflowFilePath(projectRoot, workflowId);
  try {
    const content = await fs.readFile(workflowPath, "utf-8");
    const parsed = JSON.parse(content) as PersistedWorkflow;
    return reviveWorkflow(parsed);
  } catch {
    return null;
  }
}

/**
 * Persist a workflow to disk (workflow index updates are handled separately)
 */
export async function saveWorkflow(projectRoot: string, workflow: Workflow): Promise<void> {
  await ensureWorkflowDirs(projectRoot);
  const workflowPath = getWorkflowFilePath(projectRoot, workflow.id);
  await fs.writeFile(
    workflowPath,
    JSON.stringify(serializeWorkflow(workflow), null, 2),
    "utf-8"
  );
}

/**
 * Convert workflow dates to ISO strings for persistence
 */
function serializeWorkflow(workflow: Workflow): PersistedWorkflow {
  return {
    ...workflow,
    blockingFeedbackIds: workflow.blockingFeedbackIds ?? [],
    createdAt: workflow.createdAt.toISOString(),
    updatedAt: workflow.updatedAt.toISOString(),
    stages: workflow.stages.map(serializeStage),
    messages: workflow.messages.map(serializeMessage),
  };
}

function serializeStage(stage: WorkflowStage): PersistedWorkflowStage {
  return {
    ...stage,
    startedAt: stage.startedAt ? stage.startedAt.toISOString() : undefined,
    completedAt: stage.completedAt ? stage.completedAt.toISOString() : undefined,
    gate: serializeGate(stage.gate),
  };
}

function serializeGate(gate: StageGate): PersistedStageGate {
  return {
    ...gate,
    satisfiedAt: gate.satisfiedAt ? gate.satisfiedAt.toISOString() : undefined,
  };
}

function serializeMessage(message: WorkflowMessage): PersistedWorkflowMessage {
  return {
    ...message,
    timestamp: message.timestamp.toISOString(),
  };
}

/**
 * Revive workflow JSON into rich objects with Date instances
 */
function reviveWorkflow(raw: PersistedWorkflow): Workflow {
  return {
    ...raw,
    blockingFeedbackIds: raw.blockingFeedbackIds ?? [],
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    stages: raw.stages.map(reviveStage),
    messages: raw.messages.map(reviveMessage),
  };
}

function reviveStage(stage: PersistedWorkflowStage): WorkflowStage {
  return {
    ...stage,
    startedAt: stage.startedAt ? new Date(stage.startedAt) : undefined,
    completedAt: stage.completedAt ? new Date(stage.completedAt) : undefined,
    gate: reviveGate(stage.gate),
  };
}

function reviveGate(gate: PersistedStageGate): StageGate {
  return {
    ...gate,
    satisfiedAt: gate.satisfiedAt ? new Date(gate.satisfiedAt) : undefined,
  };
}

function reviveMessage(message: PersistedWorkflowMessage): WorkflowMessage {
  return {
    ...message,
    timestamp: new Date(message.timestamp),
  };
}
