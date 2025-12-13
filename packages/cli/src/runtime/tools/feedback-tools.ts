// ADR: ADR-013-agent-tools-design

import * as fs from "node:fs/promises";
import * as path from "node:path";
import {
  WorkflowManager,
  loadWorkflow,
  saveWorkflow,
} from "@choragen/core";
import type { Workflow } from "@choragen/core";
import type { ToolDefinition } from "./types.js";
import type { ToolResult, ExecutionContext } from "./executor.js";

interface FeedbackItem {
  id: string;
  workflowId: string;
  stageIndex: number;
  question: string;
  context?: string;
  blocking: boolean;
  status: "pending" | "resolved";
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
}

async function emitFeedbackEvent(
  context: ExecutionContext,
  payload: Record<string, unknown>
): Promise<void> {
  if (!context.eventEmitter) return;
  try {
    await context.eventEmitter({ type: "feedback.created", payload });
  } catch {
    // Event emission failures should not block tool execution
  }
}

function getFeedbackDir(workspaceRoot: string, workflowId: string): string {
  return path.join(workspaceRoot, ".choragen/workflows", workflowId, "feedback");
}

async function persistFeedback(
  workspaceRoot: string,
  workflowId: string,
  item: FeedbackItem
): Promise<string> {
  const dir = getFeedbackDir(workspaceRoot, workflowId);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${item.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(item, null, 2), "utf-8");
  return filePath;
}

async function loadWorkflowOrError(
  workspaceRoot: string,
  workflowId: string
): Promise<Workflow> {
  const workflow = await loadWorkflow(workspaceRoot, workflowId);
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }
  return workflow;
}

export const feedbackCreateTool: ToolDefinition = {
  name: "feedback:create",
  description: "Create a feedback item for human response",
  parameters: {
    type: "object",
    properties: {
      workflowId: {
        type: "string",
        description: "Workflow ID to attach feedback to",
      },
      question: {
        type: "string",
        description: "Question or feedback content",
      },
      context: {
        type: "string",
        description: "Optional additional context",
      },
      blocking: {
        type: "boolean",
        description: "Whether workflow should pause until feedback is resolved",
      },
    },
    required: ["workflowId", "question"],
  },
  category: "feedback",
  mutates: true,
};

export async function executeFeedbackCreate(
  params: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  const workflowId = params.workflowId as string;
  const question = params.question as string;
  const extraContext = params.context as string | undefined;
  const blocking = Boolean(params.blocking);

  if (!workflowId) {
    return { success: false, error: "Missing required parameter: workflowId" };
  }
  if (!question) {
    return { success: false, error: "Missing required parameter: question" };
  }

  let workflow: Workflow;
  try {
    workflow = await loadWorkflowOrError(context.workspaceRoot, workflowId);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Workflow not found",
    };
  }

  const now = new Date();
  const feedback: FeedbackItem = {
    id: `FB-${now.getTime()}`,
    workflowId,
    stageIndex: workflow.currentStage,
    question,
    context: extraContext,
    blocking,
    status: "pending",
    createdByRole: context.role,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const filePath = await persistFeedback(context.workspaceRoot, workflowId, feedback);

  // If blocking, pause the workflow
  if (blocking) {
    const manager = new WorkflowManager(context.workspaceRoot);
    await manager.updateStatus(workflowId, "paused");
  } else {
    // Touch workflow to update timestamp for non-blocking feedback
    workflow.updatedAt = new Date();
    await saveWorkflow(context.workspaceRoot, workflow);
  }

  await emitFeedbackEvent(context, {
    feedbackId: feedback.id,
    workflowId,
    blocking,
    stageIndex: feedback.stageIndex,
    path: path.relative(context.workspaceRoot, filePath),
  });

  return {
    success: true,
    data: {
      feedbackId: feedback.id,
      workflowId,
      path: path.relative(context.workspaceRoot, filePath),
      blocking,
      status: feedback.status,
    },
  };
}
