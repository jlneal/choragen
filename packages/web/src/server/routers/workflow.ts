// ADR: ADR-011-web-api-architecture

/**
 * Workflow tRPC Router
 *
 * Exposes WorkflowManager from @choragen/core to the web dashboard.
 * Provides CRUD-style procedures for creating, fetching, and controlling workflows
 * plus messaging, gates, and history pagination.
 */
import { z } from "zod";
import { router, publicProcedure, TRPCError } from "../trpc";
import {
  WorkflowManager,
  WORKFLOW_STATUSES,
  MESSAGE_ROLES,
  type WorkflowStatus,
  type MessageRole,
  type WorkflowMessage,
  loadTemplate,
} from "@choragen/core";
import { spawnAgentSession } from "@/lib/agent-subprocess";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const workflowStatusEnum = z.enum(
  WORKFLOW_STATUSES as [WorkflowStatus, ...WorkflowStatus[]]
);

const messageRoleEnum = z.enum(
  MESSAGE_ROLES as [MessageRole, ...MessageRole[]]
);

const createWorkflowInputSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  template: z.string().min(1, "Template name is required"),
  initialMessage: z.string().optional(),
});

const listWorkflowInputSchema = z
  .object({
    status: workflowStatusEnum.optional(),
    requestId: z.string().optional(),
    template: z.string().optional(),
  })
  .optional();

const sendMessageInputSchema = z.object({
  workflowId: z.string().min(1, "Workflow ID is required"),
  role: messageRoleEnum,
  content: z.string().min(1, "Content is required"),
  stageIndex: z.number().int().min(0, "Stage index must be non-negative"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const satisfyGateInputSchema = z.object({
  workflowId: z.string().min(1, "Workflow ID is required"),
  stageIndex: z.number().int().min(0, "Stage index must be non-negative"),
  satisfiedBy: z.string().min(1, "Satisfied by is required"),
});

const getHistoryInputSchema = z.object({
  workflowId: z.string().min(1, "Workflow ID is required"),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

const updateStatusInputSchema = z.object({
  workflowId: z.string().min(1, "Workflow ID is required"),
  status: workflowStatusEnum,
});

const cancelWorkflowInputSchema = z.object({
  workflowId: z.string().min(1, "Workflow ID is required"),
});

const pauseWorkflowInputSchema = z.object({
  workflowId: z.string().min(1, "Workflow ID is required"),
});

const resumeWorkflowInputSchema = z.object({
  workflowId: z.string().min(1, "Workflow ID is required"),
});

const discardWorkflowInputSchema = z.object({
  workflowId: z.string().min(1, "Workflow ID is required"),
  reason: z.string().min(1, "Reason is required"),
});

const onMessageInputSchema = z.object({
  workflowId: z.string().min(1, "Workflow ID is required"),
});

const invokeAgentInputSchema = z.object({
  workflowId: z.string().min(1, "Workflow ID is required"),
  message: z.string().optional(),
});

const POLL_INTERVAL_MS = 500;
const DEFAULT_STAGE_INDEX = 0;

function createDelay(ms: number): { promise: Promise<void>; cancel: () => void } {
  let timer: NodeJS.Timeout | undefined;
  let resolveFn: (() => void) | undefined;
  const promise = new Promise<void>((resolve) => {
    resolveFn = resolve;
    timer = setTimeout(resolve, ms);
  });
  return {
    promise,
    cancel: () => {
      if (timer) {
        clearTimeout(timer);
      }
      if (resolveFn) {
        resolveFn();
      }
    },
  };
}

/**
 * Helper to create a WorkflowManager instance from context
 */
function getWorkflowManager(projectRoot: string): WorkflowManager {
  return new WorkflowManager(projectRoot);
}

async function resolveAnthropicApiKey(projectRoot: string): Promise<string | undefined> {
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }

  const configPath = path.join(projectRoot, ".choragen", "config.json");
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    const parsed = JSON.parse(raw) as {
      providers?: { anthropic?: { apiKey?: string } };
    };
    const key = parsed.providers?.anthropic?.apiKey;
    return typeof key === "string" && key.trim().length > 0 ? key : undefined;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return undefined;
    }
    return undefined;
  }
}

/**
 * Workflow router exposing WorkflowManager operations
 */
export const workflowRouter = router({
  /**
   * Create a workflow from a template.
   * Loads the specified template by name (e.g., "standard", "hotfix", "ideation").
   */
  create: publicProcedure
    .input(createWorkflowInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getWorkflowManager(ctx.projectRoot);
      const template = await loadTemplate(ctx.projectRoot, input.template);

      const workflow = await manager.create({
        requestId: input.requestId,
        template,
      });

      // If an initial message was provided, add it to the workflow
      if (input.initialMessage) {
        await manager.addMessage(workflow.id, {
          role: "human",
          content: input.initialMessage,
          stageIndex: 0,
        });
      }

      return workflow;
    }),

  /**
   * Get a workflow by ID
   */
  get: publicProcedure
    .input(z.string().min(1, "Workflow ID is required"))
    .query(async ({ ctx, input }) => {
      const manager = getWorkflowManager(ctx.projectRoot);
      const workflow = await manager.get(input);

      if (!workflow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Workflow not found: ${input}`,
        });
      }

      return workflow;
    }),

  /**
   * List workflows with optional filters
   */
  list: publicProcedure
    .input(listWorkflowInputSchema)
    .query(async ({ ctx, input }) => {
      const manager = getWorkflowManager(ctx.projectRoot);
      return manager.list(input ?? {});
    }),

  /**
   * Send a message to a workflow
   */
  sendMessage: publicProcedure
    .input(sendMessageInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getWorkflowManager(ctx.projectRoot);

      try {
        return await manager.addMessage(input.workflowId, {
          role: input.role,
          content: input.content,
          stageIndex: input.stageIndex,
          metadata: input.metadata,
        });
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to add message",
        });
      }
    }),

  /**
   * Invoke an agent for the current workflow stage.
   * Returns a session placeholder; actual spawning handled in later tasks.
   */
  invokeAgent: publicProcedure
    .input(invokeAgentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getWorkflowManager(ctx.projectRoot);
      const workflow = await manager.get(input.workflowId);

      if (!workflow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Workflow not found: ${input.workflowId}`,
        });
      }

      if (workflow.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Workflow is ${workflow.status}, cannot invoke agent`,
        });
      }

      const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const stageIndex =
        typeof workflow.currentStage === "number"
          ? Math.max(DEFAULT_STAGE_INDEX, workflow.currentStage)
          : DEFAULT_STAGE_INDEX;

      try {
        const apiKey = await resolveAnthropicApiKey(ctx.projectRoot);

        spawnAgentSession(sessionId, {
          workflowId: input.workflowId,
          stageIndex,
          projectRoot: ctx.projectRoot,
          apiKey,
          message: input.message,
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to start agent session",
          cause: error,
        });
      }

      return {
        sessionId,
        workflowId: input.workflowId,
        stageIndex,
        status: "running",
      };
    }),

  /**
   * Mark a gate as satisfied for the current stage
   */
  satisfyGate: publicProcedure
    .input(satisfyGateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getWorkflowManager(ctx.projectRoot);

      try {
        return await manager.satisfyGate(
          input.workflowId,
          input.stageIndex,
          input.satisfiedBy
        );
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to satisfy gate",
        });
      }
    }),

  /**
   * Get workflow message history with pagination
   */
  getHistory: publicProcedure
    .input(getHistoryInputSchema)
    .query(async ({ ctx, input }) => {
      const manager = getWorkflowManager(ctx.projectRoot);
      const workflow = await manager.get(input.workflowId);

      if (!workflow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Workflow not found: ${input.workflowId}`,
        });
      }

      const limit = input.limit ?? 50;
      const offset = input.offset ?? 0;

      const sortedMessages = [...workflow.messages].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      return sortedMessages.slice(offset, offset + limit);
    }),

  /**
   * Update workflow status (pause, cancel, etc.)
   */
  updateStatus: publicProcedure
    .input(updateStatusInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getWorkflowManager(ctx.projectRoot);

      try {
        return await manager.updateStatus(input.workflowId, input.status);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to update status",
        });
      }
    }),

  /**
   * Cancel an active workflow
   */
  cancel: publicProcedure
    .input(cancelWorkflowInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getWorkflowManager(ctx.projectRoot);

      try {
        return await manager.updateStatus(input.workflowId, "cancelled");
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to cancel workflow",
        });
      }
    }),

  /**
   * Pause an active workflow
   */
  pause: publicProcedure
    .input(pauseWorkflowInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getWorkflowManager(ctx.projectRoot);
      try {
        return await manager.updateStatus(input.workflowId, "paused");
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to pause workflow",
        });
      }
    }),

  /**
   * Discard a workflow with reasoning
   */
  discard: publicProcedure
    .input(discardWorkflowInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getWorkflowManager(ctx.projectRoot);

      try {
        return await manager.discard(input.workflowId, input.reason);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to discard workflow",
        });
      }
    }),

  /**
   * Resume a paused workflow
   */
  resume: publicProcedure
    .input(resumeWorkflowInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getWorkflowManager(ctx.projectRoot);
      try {
        return await manager.updateStatus(input.workflowId, "active");
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to resume workflow",
        });
      }
    }),

  /**
   * Subscribe to workflow messages with initial backlog and live updates.
   * Uses simple polling for now; will move to event-driven updates later.
   */
  onMessage: publicProcedure
    .input(onMessageInputSchema)
    .subscription(async function* ({ ctx, input }) {
      const manager = getWorkflowManager(ctx.projectRoot);
      const workflow = await manager.get(input.workflowId);

      if (!workflow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Workflow not found: ${input.workflowId}`,
        });
      }

      let lastIndex = 0;
      for (const message of workflow.messages) {
        yield message;
        lastIndex += 1;
      }

      let delayHandle: { promise: Promise<void>; cancel: () => void } | undefined;
      try {
        while (true) {
          delayHandle = createDelay(POLL_INTERVAL_MS);
          await delayHandle.promise;
          delayHandle = undefined;

          const current = await manager.get(input.workflowId);
          if (!current) {
            return;
          }

          if (current.messages.length > lastIndex) {
            const newMessages: WorkflowMessage[] = current.messages.slice(lastIndex);
            for (const message of newMessages) {
              yield message;
            }
            lastIndex = current.messages.length;
          }
        }
      } finally {
        if (delayHandle) {
          delayHandle.cancel();
        }
      }
    }),
});
