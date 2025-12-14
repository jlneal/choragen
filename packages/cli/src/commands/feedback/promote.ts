// ADR: ADR-003-cli-structure

/**
 * feedback:promote command - promote a feedback item into a Change Request
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import {
  FeedbackManager,
  getWorkflowsDir,
  feedbackItemSchema,
  type FeedbackCategory,
  type FeedbackItem,
} from "@choragen/core";

import { createCR } from "../docs.js";

export interface FeedbackPromoteContext {
  projectRoot: string;
  feedbackManager?: FeedbackManager;
}

export interface FeedbackPromoteOptions {
  feedbackId: string;
  workflowId: string;
  respondedBy?: string;
}

export interface FeedbackPromoteResult {
  success: boolean;
  feedbackId?: string;
  crId?: string;
  crPath?: string;
  error?: string;
}

const DEFAULT_DOMAIN = "core";
const FEEDBACK_DIR_NAME = "feedback";

const CATEGORY_DOMAIN_MAP: Record<FeedbackCategory, string> = {
  lint: "lint",
  workflow: "workflow",
  environment: "environment",
  documentation: "documentation",
  testing: "testing",
  "commit-hook": "tooling",
  "workflow-hook": "workflow",
};

export async function promoteFeedbackCommand(
  context: FeedbackPromoteContext,
  options: FeedbackPromoteOptions
): Promise<FeedbackPromoteResult> {
  const manager = context.feedbackManager ?? new FeedbackManager(context.projectRoot);
  const { feedbackId, workflowId } = options;

  if (!feedbackId || !workflowId) {
    return {
      success: false,
      error: "feedbackId and workflowId are required",
    };
  }

  const existing = await manager.get(feedbackId, workflowId);
  if (!existing) {
    return { success: false, error: `Feedback not found: ${feedbackId}` };
  }

  if (existing.status === "resolved") {
    return { success: false, error: `Feedback ${feedbackId} is already resolved` };
  }
  if (existing.status === "dismissed") {
    return { success: false, error: `Feedback ${feedbackId} is dismissed and cannot be promoted` };
  }

  const title = titleFromFeedback(existing.content);
  const slug = slugify(title) || "feedback-promotion";
  const domain = mapCategoryToDomain(existing.category);
  const description = existing.content;
  const motivation = buildMotivation(existing);
  const notes = buildNotes(existing);

  const createResult = await createCR(context.projectRoot, {
    slug,
    title,
    domain,
  });

  if (!createResult.success || !createResult.id || !createResult.filePath) {
    return {
      success: false,
      error: createResult.error || "Failed to create change request",
    };
  }

  try {
    await writeChangeRequestFromFeedback({
      projectRoot: context.projectRoot,
      crId: createResult.id,
      filePath: createResult.filePath,
      title,
      description,
      motivation,
      notes,
      domain,
    });
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }

  let resolved: FeedbackItem;
  try {
    resolved = await manager.respond(
      feedbackId,
      {
        content: `Promoted to ${createResult.id}`,
        respondedBy: options.respondedBy ?? "feedback:promote",
      },
      workflowId
    );
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }

  const updatedFeedback = feedbackItemSchema.parse({
    ...resolved,
    promotedTo: createResult.id,
    updatedAt: new Date(),
  });

  await persistFeedback(context.projectRoot, updatedFeedback);

  return {
    success: true,
    feedbackId,
    crId: createResult.id,
    crPath: createResult.filePath,
  };
}

export function createFeedbackPromoteContext(
  projectRoot: string
): FeedbackPromoteContext {
  return {
    projectRoot,
    feedbackManager: new FeedbackManager(projectRoot),
  };
}

function mapCategoryToDomain(category?: FeedbackCategory): string {
  if (!category) return DEFAULT_DOMAIN;
  return CATEGORY_DOMAIN_MAP[category] ?? DEFAULT_DOMAIN;
}

function titleFromFeedback(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length === 0) return "Promoted feedback";
  if (trimmed.length <= 80) return trimmed;
  return `${trimmed.slice(0, 77)}...`;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildMotivation(feedback: FeedbackItem): string {
  const parts = [
    `Promoted from ${feedback.type} feedback ${feedback.id}`,
  ];
  if (feedback.category) {
    parts.push(`Category: ${feedback.category}`);
  }
  if (feedback.source) {
    parts.push(`Source: ${feedback.source}`);
  }
  return parts.join(" — ");
}

function buildNotes(feedback: FeedbackItem): string {
  const details = [
    `Workflow: ${feedback.workflowId}`,
    `Stage: ${feedback.stageIndex}`,
  ];
  if (feedback.taskId) {
    details.push(`Task: ${feedback.taskId}`);
  }
  if (feedback.chainId) {
    details.push(`Chain: ${feedback.chainId}`);
  }
  return `Generated via feedback:promote. ${details.join(", ")}`;
}

interface ChangeRequestRenderInput {
  projectRoot: string;
  crId: string;
  filePath: string;
  title: string;
  description: string;
  motivation: string;
  notes: string;
  domain: string;
}

async function writeChangeRequestFromFeedback(input: ChangeRequestRenderInput): Promise<void> {
  const { projectRoot, crId, filePath, title, description, motivation, notes, domain } = input;
  const templatePath = path.join(projectRoot, "templates", "change-request.md");
  const template = await fs.readFile(templatePath, "utf-8");
  const parsed = parseCrId(crId);
  if (!parsed) {
    throw new Error(`Invalid change request ID: ${crId}`);
  }

  const content = replacePlaceholders(template, {
    TITLE: title,
    DATE: parsed.dateStamp,
    DATE_FORMATTED: parsed.formattedDate,
    SEQ: parsed.sequence,
    DOMAIN: domain,
    OWNER: "agent",
    DESCRIPTION: description,
    MOTIVATION: motivation,
    IN_SCOPE_1: description,
    IN_SCOPE_2: "[Define follow-on items]",
    OUT_OF_SCOPE_1: "[Out of scope items]",
    FEATURE_DOC_1: "[Link to feature or design doc]",
    DESIGN_DOC_2: "[Link to additional design docs]",
    ADR_1: "[Link to ADR]",
    NOTES: notes,
  });

  const absolutePath = path.join(projectRoot, filePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content, "utf-8");
}

function replacePlaceholders(content: string, values: Record<string, string>): string {
  return content.replace(/{{\s*([A-Z0-9_]+)\s*}}/g, (_, key: string) => {
    return values[key] ?? "";
  });
}

function parseCrId(crId: string):
  | { dateStamp: string; sequence: string; formattedDate: string }
  | null {
  const match = crId.match(/^CR-(\d{8})-(\d{3})/);
  if (!match) return null;
  const [, dateStamp, sequence] = match;
  const formattedDate = `${dateStamp.slice(0, 4)}-${dateStamp.slice(4, 6)}-${dateStamp.slice(6, 8)}`;
  return { dateStamp, sequence, formattedDate };
}

async function persistFeedback(
  projectRoot: string,
  feedback: FeedbackItem
): Promise<void> {
  const serialized = {
    ...feedback,
    createdAt: feedback.createdAt.toISOString(),
    updatedAt: feedback.updatedAt.toISOString(),
    resolvedAt: feedback.resolvedAt ? feedback.resolvedAt.toISOString() : undefined,
    response: feedback.response
      ? {
          ...feedback.response,
          respondedAt: feedback.response.respondedAt.toISOString(),
        }
      : undefined,
  };

  const filePath = path.join(
    getWorkflowsDir(projectRoot),
    feedback.workflowId,
    FEEDBACK_DIR_NAME,
    `${feedback.id}.json`
  );
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(serialized, null, 2), "utf-8");
}
