// ADR: ADR-011-workflow-orchestration
// Design doc: docs/design/core/features/agent-feedback.md

/**
 * feedback:create tool implements a feedback item for a workflow using FeedbackManager.
 *
 * Design doc: docs/design/core/features/agent-feedback.md
 */

import { z } from "zod";
import { FeedbackManager } from "../feedback/FeedbackManager.js";
import {
  feedbackContextSchema,
  feedbackPrioritySchema,
  feedbackTypeSchema,
} from "../feedback/schemas.js";
import type { FeedbackItem, FeedbackPriority } from "../feedback/types.js";
import { loadWorkflow } from "../workflow/persistence.js";
import type { ToolParameterSchema } from "../roles/types.js";

const nonEmptyString = (field: string) =>
  z
    .string({ required_error: `${field} is required` })
    .trim()
    .min(1, { message: `${field} is required` });

const feedbackCreateInputSchema = z.object({
  workflowId: nonEmptyString("Workflow ID"),
  type: feedbackTypeSchema,
  content: nonEmptyString("Feedback content"),
  priority: feedbackPrioritySchema.optional(),
  context: feedbackContextSchema.optional(),
  taskId: nonEmptyString("Task ID").optional(),
  chainId: nonEmptyString("Chain ID").optional(),
});

export interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  parameters: ToolParameterSchema;
  mutates: boolean;
}

export interface FeedbackCreateContext {
  projectRoot: string;
  roleId: string;
}

export type FeedbackCreateParams = z.infer<typeof feedbackCreateInputSchema>;

export type FeedbackCreateResult =
  | {
      success: true;
      data: {
        feedbackId: string;
        workflowId: string;
        status: FeedbackItem["status"];
        priority: FeedbackPriority;
      };
    }
  | {
      success: false;
      error: string;
      details?: unknown;
    };

const feedbackCreateParameters: ToolParameterSchema = {
  type: "object",
  properties: {
    workflowId: {
      type: "string",
      description: "Workflow ID to attach feedback to",
    },
    type: {
      type: "string",
      description: "Feedback type",
      enum: ["clarification", "question", "idea", "blocker", "review"],
    },
    content: {
      type: "string",
      description: "Question or feedback content",
    },
    priority: {
      type: "string",
      description: "Optional priority override",
      enum: ["low", "medium", "high", "critical"],
    },
    // eslint-disable-next-line @choragen/no-as-unknown -- ToolParameterSchema doesn't support nested object properties
    context: {
      type: "object",
      description: "Optional feedback context (files, code snippets, options)",
      properties: {
        files: {
          type: "array",
          description: "Related file paths",
          items: { type: "string" },
        },
        codeSnippets: {
          type: "array",
          description: "Code snippets for reference",
          items: {
            type: "object",
            properties: {
              file: { type: "string" },
              startLine: { type: "number" },
              endLine: { type: "number" },
              content: { type: "string" },
            },
            required: ["file", "startLine", "endLine", "content"],
          },
        },
        options: {
          type: "array",
          description: "Options the agent is considering",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              description: { type: "string" },
              recommended: { type: "boolean" },
            },
            required: ["label", "description"],
          },
        },
      },
    } as unknown as ToolParameterSchema["properties"][string],
    taskId: {
      type: "string",
      description: "Task ID if feedback is task-specific",
    },
    chainId: {
      type: "string",
      description: "Chain ID if feedback is chain-specific",
    },
  },
  required: ["workflowId", "type", "content"],
};

export const feedbackCreateTool: ToolDefinition = {
  name: "feedback:create",
  description: "Create a structured feedback item for human response",
  category: "feedback",
  mutates: true,
  parameters: feedbackCreateParameters,
};

export async function executeFeedbackCreate(
  params: unknown,
  context: FeedbackCreateContext
): Promise<FeedbackCreateResult> {
  let parsed: FeedbackCreateParams;

  try {
    parsed = feedbackCreateInputSchema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid feedback parameters",
        details: error.flatten(),
      };
    }
    return { success: false, error: (error as Error).message };
  }

  const workflow = await loadWorkflow(context.projectRoot, parsed.workflowId);
  if (!workflow) {
    return {
      success: false,
      error: `Workflow not found: ${parsed.workflowId}`,
    };
  }

  const manager = new FeedbackManager(context.projectRoot);

  let created: FeedbackItem;
  try {
    created = await manager.create({
      workflowId: parsed.workflowId,
      stageIndex: workflow.currentStage,
      taskId: parsed.taskId,
      chainId: parsed.chainId,
      type: parsed.type,
      createdByRole: context.roleId,
      content: parsed.content,
      context: parsed.context,
      priority: parsed.priority as FeedbackPriority | undefined,
    });
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }

  return {
    success: true,
    data: {
      feedbackId: created.id,
      workflowId: created.workflowId,
      status: created.status,
      priority: created.priority,
    },
  };
}
