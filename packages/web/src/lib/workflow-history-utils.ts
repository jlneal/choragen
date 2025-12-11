// ADR: ADR-011-web-api-architecture
/**
 * Utility functions for workflow history page
 * Extracted to allow testing without Next.js page export restrictions
 */

import type { WorkflowStatus } from "@choragen/core";

/** Client-safe copy of WORKFLOW_STATUSES to avoid importing Node.js modules */
const WORKFLOW_STATUSES: readonly WorkflowStatus[] = [
  "active",
  "paused",
  "completed",
  "failed",
  "cancelled",
];

/** Simplified workflow summary that accepts serialized tRPC responses */
export interface WorkflowSummary {
  id: string;
  status: WorkflowStatus;
  requestId?: string;
  currentStage?: number;
  stages?: unknown[];
  updatedAt?: Date | string;
}

export interface WorkflowGroup {
  status: WorkflowStatus | "other";
  workflows: WorkflowSummary[];
}

export const STATUS_ORDER: (WorkflowStatus | "other")[] = [
  "active",
  "paused",
  "completed",
  "cancelled",
  "failed",
  "other",
];

export const STATUS_LABELS: Record<WorkflowStatus | "other", string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
  failed: "Failed",
  other: "Other",
};

function normalizeDate(timestamp?: Date | string): Date | null {
  if (!timestamp) return null;
  const parsed = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatStageProgress(currentStage?: number, stages?: unknown[]): string {
  if (!Array.isArray(stages) || stages.length === 0 || typeof currentStage !== "number") {
    return "No stages available";
  }

  const clampedStage = Math.min(Math.max(currentStage, 0), stages.length - 1);
  const DISPLAY_OFFSET = 1;
  return `Stage ${clampedStage + DISPLAY_OFFSET} of ${stages.length}`;
}

export function sortWorkflowsByActivity(workflows: WorkflowSummary[]): WorkflowSummary[] {
  const DEFAULT_TIMESTAMP_MS = 0;
  return [...workflows].sort((a, b) => {
    const aTime = normalizeDate(a.updatedAt)?.getTime() ?? DEFAULT_TIMESTAMP_MS;
    const bTime = normalizeDate(b.updatedAt)?.getTime() ?? DEFAULT_TIMESTAMP_MS;
    return bTime - aTime;
  });
}

export function groupWorkflowsByStatus(workflows: WorkflowSummary[]): WorkflowGroup[] {
  const initialGroups = STATUS_ORDER.map((status) => ({
    status,
    workflows: [] as WorkflowSummary[],
  }));

  for (const workflow of workflows) {
    const knownStatus = WORKFLOW_STATUSES.includes(workflow.status as WorkflowStatus);
    const targetStatus = knownStatus ? (workflow.status as WorkflowStatus) : "other";
    const targetGroup = initialGroups.find((group) => group.status === targetStatus);

    if (targetGroup) {
      targetGroup.workflows.push(workflow);
    }
  }

  return initialGroups
    .map((group) => ({
      ...group,
      workflows: sortWorkflowsByActivity(group.workflows),
    }))
    .filter((group) => group.workflows.length > 0);
}
