// ADR: ADR-011-workflow-orchestration

/**
 * Stage-specific handlers for workflow lifecycle events.
 *
 * Currently supports the reflection stage, which generates improvement
 * feedback items after fix completion.
 */

import { FeedbackManager } from "../feedback/FeedbackManager.js";
import {
  FEEDBACK_CATEGORIES,
  type FeedbackCategory,
  type FeedbackItem,
} from "../feedback/types.js";
import type { Workflow, WorkflowStage, StageType } from "./types.js";

const REFLECTION_PROMPTS = [
  "Root cause analysis of the defect",
  "Escape analysis (why it was not caught earlier)",
  "Preventive measures and guardrails",
  `Categorize each suggestion using: ${FEEDBACK_CATEGORIES.join(", ")}`,
] as const;

export interface StageHandlerContext {
  projectRoot: string;
  workflow: Workflow;
  stage: WorkflowStage;
  stageIndex: number;
  feedbackManager: FeedbackManager;
}

type StageHandler = (context: StageHandlerContext) => Promise<void>;

const HANDLERS: Partial<Record<StageType, StageHandler>> = {
  reflection: handleReflectionStage,
};

export async function runStageHandlers(context: StageHandlerContext): Promise<void> {
  const handler = HANDLERS[context.stage.type];
  if (!handler) return;
  await handler(context);
}

async function handleReflectionStage(context: StageHandlerContext): Promise<void> {
  const existingReflection = await context.feedbackManager.list({
    workflowId: context.workflow.id,
    source: "reflection",
    type: "idea",
  });
  if (existingReflection.some((item) => item.stageIndex === context.stageIndex)) {
    return;
  }

  const content = buildReflectionContent(context.workflow.requestId);
  const category: FeedbackCategory = "workflow";

  await context.feedbackManager.create({
    workflowId: context.workflow.id,
    stageIndex: context.stageIndex,
    chainId: context.stage.chainId,
    type: "idea",
    source: "reflection",
    category,
    createdByRole: "system",
    content,
    context: {
      metadata: {
        prompts: REFLECTION_PROMPTS,
        requestId: context.workflow.requestId,
        stageName: context.stage.name,
      },
    } satisfies FeedbackItem["context"],
  });
}

function buildReflectionContent(requestId: string): string {
  return [
    `Post-fix reflection for ${requestId}.`,
    "Provide improvement suggestions covering:",
    "- Root cause analysis",
    "- Escape analysis (why it was not caught earlier)",
    "- Preventive measures and guardrails",
    `- Categorize suggestions using: ${FEEDBACK_CATEGORIES.join(", ")}`,
  ].join("\n");
}
