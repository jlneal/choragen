// ADR: ADR-011-workflow-orchestration
// Design doc: docs/design/core/features/agent-feedback.md

/**
 * Feedback lifecycle manager
 *
 * Provides CRUD and lifecycle operations for feedback items.
 *
 * Design doc: docs/design/core/features/agent-feedback.md
 */

import * as fs from "node:fs/promises";
import type { Dirent } from "node:fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";

import { ensureWorkflowDirs, getWorkflowsDir } from "../workflow/persistence.js";
import {
  type FeedbackContext,
  type FeedbackItem,
  type FeedbackPriority,
  type FeedbackResponse,
  type FeedbackStatus,
  type FeedbackType,
  FEEDBACK_TYPE_BEHAVIOR,
  FEEDBACK_TYPES,
} from "./types.js";
import {
  feedbackItemSchema,
  feedbackResponseSchema,
} from "./schemas.js";

const FEEDBACK_DIR_NAME = "feedback";
const FEEDBACK_INDEX_FILE = "feedback-index.json";

const DEFAULT_PRIORITY_BY_TYPE: Record<FeedbackType, FeedbackPriority> =
  FEEDBACK_TYPES.reduce<Record<FeedbackType, FeedbackPriority>>(
    (priorities, type) => {
      priorities[type] = FEEDBACK_TYPE_BEHAVIOR[type].defaultPriority;
      return priorities;
    },
    {} as Record<FeedbackType, FeedbackPriority>
  );

interface FeedbackIndex {
  lastSequence: number;
}

interface PersistedFeedbackItem
  extends Omit<
    FeedbackItem,
    "createdAt" | "updatedAt" | "resolvedAt" | "response"
  > {
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  response?: PersistedFeedbackResponse;
}

interface PersistedFeedbackResponse
  extends Omit<FeedbackResponse, "respondedAt"> {
  respondedAt: string;
}

export interface CreateFeedbackInput {
  workflowId: string;
  stageIndex: number;
  taskId?: string;
  chainId?: string;
  type: FeedbackType;
  createdByRole: string;
  content: string;
  context?: FeedbackContext;
  priority?: FeedbackPriority;
}

export interface FeedbackResponseInput
  extends Omit<FeedbackResponse, "respondedAt"> {
  respondedAt?: Date;
}

export interface ListFeedbackFilters {
  workflowId?: string;
  status?: FeedbackStatus;
  type?: FeedbackType;
  priority?: FeedbackPriority;
}

export class FeedbackManager {
  constructor(private readonly projectRoot: string) {}

  /**
   * Create a new feedback item for a workflow.
   */
  async create(input: CreateFeedbackInput): Promise<FeedbackItem> {
    await ensureWorkflowDirs(this.projectRoot);
    const id = await this.nextFeedbackId(input.workflowId);
    const now = new Date();
    const priority = resolvePriority(input.type, input.priority);

    const feedback: FeedbackItem = {
      id,
      workflowId: input.workflowId,
      stageIndex: input.stageIndex,
      taskId: input.taskId,
      chainId: input.chainId,
      type: input.type,
      createdByRole: input.createdByRole,
      content: input.content,
      context: input.context,
      status: "pending",
      priority,
      createdAt: now,
      updatedAt: now,
    };

    const validated = feedbackItemSchema.parse(feedback);
    await this.saveFeedbackItem(validated);
    return validated;
  }

  /**
   * Get a feedback item by ID.
   */
  async get(id: string, workflowId?: string): Promise<FeedbackItem | null> {
    if (workflowId) {
      return this.loadFeedbackItem(workflowId, id);
    }

    const workflowIds = await this.listWorkflowIdsWithFeedback();
    for (const wfId of workflowIds) {
      const item = await this.loadFeedbackItem(wfId, id);
      if (item) return item;
    }

    return null;
  }

  /**
   * List feedback items with optional filtering.
   */
  async list(filters: ListFeedbackFilters = {}): Promise<FeedbackItem[]> {
    const workflowIds = filters.workflowId
      ? [filters.workflowId]
      : await this.listWorkflowIdsWithFeedback();

    const results: FeedbackItem[] = [];
    for (const workflowId of workflowIds) {
      const dir = this.getFeedbackDir(workflowId);
      const entries = await this.safeReadDir(dir);
      for (const entry of entries) {
        if (
          !entry.isFile() ||
          !entry.name.endsWith(".json") ||
          entry.name === FEEDBACK_INDEX_FILE
        ) {
          continue;
        }

        const id = entry.name.replace(/\.json$/, "");
        const item = await this.loadFeedbackItem(workflowId, id);
        if (!item) continue;

        if (filters.status && item.status !== filters.status) continue;
        if (filters.type && item.type !== filters.type) continue;
        if (filters.priority && item.priority !== filters.priority) continue;
        results.push(item);
      }
    }

    return results;
  }

  /**
   * Mark a feedback item as acknowledged.
   */
  async acknowledge(id: string, workflowId?: string): Promise<FeedbackItem> {
    const feedback = await this.requireFeedback(id, workflowId);
    if (feedback.status !== "pending") {
      throw new Error("Only pending feedback can be acknowledged");
    }

    feedback.status = "acknowledged";
    feedback.updatedAt = nextTimestamp(feedback.updatedAt);
    await this.saveFeedbackItem(feedback);
    return feedback;
  }

  /**
   * Respond to a feedback item and mark as resolved.
   */
  async respond(
    id: string,
    response: FeedbackResponseInput,
    workflowId?: string
  ): Promise<FeedbackItem> {
    const feedback = await this.requireFeedback(id, workflowId);
    if (feedback.status === "resolved") {
      throw new Error("Feedback is already resolved");
    }
    if (feedback.status === "dismissed") {
      throw new Error("Cannot respond to dismissed feedback");
    }

    const parsedResponse = feedbackResponseSchema.parse({
      ...response,
      respondedAt: response.respondedAt ?? new Date(),
    });

    feedback.response = parsedResponse;
    feedback.status = "resolved";
    feedback.resolvedAt = parsedResponse.respondedAt;
    feedback.updatedAt = new Date();
    await this.saveFeedbackItem(feedback);
    return feedback;
  }

  /**
   * Dismiss a feedback item.
   */
  async dismiss(id: string, workflowId?: string): Promise<FeedbackItem> {
    const feedback = await this.requireFeedback(id, workflowId);
    if (feedback.status === "dismissed") {
      return feedback;
    }
    if (feedback.status === "resolved") {
      throw new Error("Cannot dismiss resolved feedback");
    }

    feedback.status = "dismissed";
    feedback.updatedAt = new Date();
    await this.saveFeedbackItem(feedback);
    return feedback;
  }

  private async requireFeedback(
    id: string,
    workflowId?: string
  ): Promise<FeedbackItem> {
    const feedback = await this.get(id, workflowId);
    if (!feedback) {
      throw new Error(`Feedback ${id} not found`);
    }
    return feedback;
  }

  private async nextFeedbackId(workflowId: string): Promise<string> {
    const index = await this.loadFeedbackIndex(workflowId);
    const next = index.lastSequence + 1;
    index.lastSequence = next;
    await this.saveFeedbackIndex(workflowId, index);
    return `FB-${formatSequence(next)}`;
  }

  private getFeedbackDir(workflowId: string): string {
    return path.join(getWorkflowsDir(this.projectRoot), workflowId, FEEDBACK_DIR_NAME);
  }

  private getFeedbackFilePath(workflowId: string, id: string): string {
    return path.join(this.getFeedbackDir(workflowId), `${id}.json`);
  }

  private async loadFeedbackIndex(workflowId: string): Promise<FeedbackIndex> {
    const dir = this.getFeedbackDir(workflowId);
    await fs.mkdir(dir, { recursive: true });
    const indexPath = path.join(dir, FEEDBACK_INDEX_FILE);
    try {
      const raw = await fs.readFile(indexPath, "utf-8");
      const parsed = JSON.parse(raw) as FeedbackIndex;
      return { lastSequence: parsed.lastSequence ?? 0 };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return { lastSequence: 0 };
      }
      throw error;
    }
  }

  private async saveFeedbackIndex(
    workflowId: string,
    index: FeedbackIndex
  ): Promise<void> {
    const dir = this.getFeedbackDir(workflowId);
    await fs.mkdir(dir, { recursive: true });
    const indexPath = path.join(dir, FEEDBACK_INDEX_FILE);
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2), "utf-8");
  }

  private async loadFeedbackItem(
    workflowId: string,
    id: string
  ): Promise<FeedbackItem | null> {
    const filePath = this.getFeedbackFilePath(workflowId, id);
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const raw = JSON.parse(content) as PersistedFeedbackItem;
      return feedbackItemSchema.parse({
        ...raw,
        response: raw.response
          ? feedbackResponseSchema.parse({
              ...raw.response,
            })
          : undefined,
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  private async saveFeedbackItem(feedback: FeedbackItem): Promise<void> {
    const filePath = this.getFeedbackFilePath(feedback.workflowId, feedback.id);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const serialized = serializeFeedback(feedback);
    await fs.writeFile(filePath, JSON.stringify(serialized, null, 2), "utf-8");
  }

  private async listWorkflowIdsWithFeedback(): Promise<string[]> {
    const workflowsDir = getWorkflowsDir(this.projectRoot);
    const entries = await this.safeReadDir(workflowsDir);
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  }

  private async safeReadDir(dir: string): Promise<Dirent[]> {
    try {
      return await fs.readdir(dir, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }
}

function resolvePriority(
  type: FeedbackType,
  priority?: FeedbackPriority
): FeedbackPriority {
  if (priority) return priority;
  return DEFAULT_PRIORITY_BY_TYPE[type] ?? "medium";
}

function formatSequence(seq: number): string {
  if (Number.isNaN(seq) || seq <= 0) {
    return randomUUID();
  }
  return seq.toString().padStart(3, "0");
}

function serializeFeedback(
  feedback: FeedbackItem
): PersistedFeedbackItem {
  return {
    ...feedback,
    createdAt: feedback.createdAt.toISOString(),
    updatedAt: feedback.updatedAt.toISOString(),
    resolvedAt: feedback.resolvedAt
      ? feedback.resolvedAt.toISOString()
      : undefined,
    response: feedback.response
      ? {
          ...feedback.response,
          respondedAt: feedback.response.respondedAt.toISOString(),
        }
      : undefined,
  };
}

function nextTimestamp(previous: Date): Date {
  const now = new Date();
  if (now.getTime() > previous.getTime()) {
    return now;
  }
  return new Date(previous.getTime() + 1);
}
