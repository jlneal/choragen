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

const workflowStatusEnum = z.enum(
  WORKFLOW_STATUSES as [WorkflowStatus, ...WorkflowStatus[]]
);

const messageRoleEnum = z.enum(
  MESSAGE_ROLES as [MessageRole, ...MessageRole[]]
);

const createWorkflowInputSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  template: z.string().min(1, "Template name is required"),
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

const onMessageInputSchema = z.object({
  workflowId: z.string().min(1, "Workflow ID is required"),
});

const POLL_INTERVAL_MS = 500;

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

/**
 * Workflow router exposing WorkflowManager operations
 */
export const workflowRouter = router({
  /**
   * Create a workflow from a template.
   * Currently always loads the built-in "standard" template regardless of input,
   * accepting the template name for future template selection support.
   */
  create: publicProcedure
    .input(createWorkflowInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getWorkflowManager(ctx.projectRoot);
      const template = await loadTemplate(ctx.projectRoot, "standard");

      return manager.create({
        requestId: input.requestId,
        template,
      });
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
