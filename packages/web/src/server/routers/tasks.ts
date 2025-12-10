// ADR: ADR-011-web-api-architecture

/**
 * Tasks tRPC Router
 *
 * Exposes task management functionality from @choragen/core to the web dashboard.
 * Provides full CRUD operations and status transitions for tasks within chains.
 */
import { z } from "zod";
import { router, publicProcedure, TRPCError } from "../trpc";
import { TaskManager, MetricsCollector, type TaskStatus } from "@choragen/core";

/**
 * Zod schema for task status values
 */
const taskStatusSchema = z.enum([
  "backlog",
  "todo",
  "in-progress",
  "in-review",
  "done",
  "blocked",
]) as z.ZodType<TaskStatus>;

/**
 * Zod schema for getting a task by chain and task ID
 */
const getTaskInputSchema = z.object({
  chainId: z.string().min(1, "Chain ID is required"),
  taskId: z.string().min(1, "Task ID is required"),
});

/**
 * Zod schema for creating a new task
 */
const createTaskInputSchema = z.object({
  chainId: z.string().min(1, "Chain ID is required"),
  slug: z.string().min(1, "Slug is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  expectedFiles: z.array(z.string()).optional(),
  acceptance: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

/**
 * Zod schema for updating a task
 */
const updateTaskInputSchema = z.object({
  chainId: z.string().min(1, "Chain ID is required"),
  taskId: z.string().min(1, "Task ID is required"),
  updates: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    expectedFiles: z.array(z.string()).optional(),
    acceptance: z.array(z.string()).optional(),
    constraints: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }),
});

/**
 * Zod schema for task transition
 */
const transitionTaskInputSchema = z.object({
  chainId: z.string().min(1, "Chain ID is required"),
  taskId: z.string().min(1, "Task ID is required"),
  newStatus: taskStatusSchema,
});

/**
 * Zod schema for rework mutation (includes optional reason)
 */
const reworkTaskInputSchema = z.object({
  chainId: z.string().min(1, "Chain ID is required"),
  taskId: z.string().min(1, "Task ID is required"),
  reason: z.string().optional(),
});

/**
 * Helper to create a TaskManager instance from context
 */
function getTaskManager(projectRoot: string): TaskManager {
  return new TaskManager(projectRoot);
}

/**
 * Helper to create a MetricsCollector instance from context
 */
function getMetricsCollector(projectRoot: string): MetricsCollector {
  return new MetricsCollector(projectRoot);
}

/**
 * Tasks router with full CRUD operations and status transitions
 */
export const tasksRouter = router({
  /**
   * Get a single task by chain ID and task ID
   */
  get: publicProcedure
    .input(getTaskInputSchema)
    .query(async ({ ctx, input }) => {
      const manager = getTaskManager(ctx.projectRoot);
      const task = await manager.getTask(input.chainId, input.taskId);

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Task not found: ${input.taskId} in chain ${input.chainId}`,
        });
      }

      return task;
    }),

  /**
   * List all tasks for a chain
   */
  listForChain: publicProcedure
    .input(z.string().min(1, "Chain ID is required"))
    .query(async ({ ctx, input }) => {
      const manager = getTaskManager(ctx.projectRoot);
      return manager.getTasksForChain(input);
    }),

  /**
   * Create a new task in a chain
   */
  create: publicProcedure
    .input(createTaskInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getTaskManager(ctx.projectRoot);
      return manager.createTask(input);
    }),

  /**
   * Update task content
   */
  update: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getTaskManager(ctx.projectRoot);
      const task = await manager.updateTask(
        input.chainId,
        input.taskId,
        input.updates
      );

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Task not found: ${input.taskId} in chain ${input.chainId}`,
        });
      }

      return task;
    }),

  /**
   * Delete a task
   */
  delete: publicProcedure
    .input(getTaskInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getTaskManager(ctx.projectRoot);
      const deleted = await manager.deleteTask(input.chainId, input.taskId);

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Task not found: ${input.taskId} in chain ${input.chainId}`,
        });
      }

      return { success: true, chainId: input.chainId, taskId: input.taskId };
    }),

  /**
   * Generic status transition
   */
  transition: publicProcedure
    .input(transitionTaskInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getTaskManager(ctx.projectRoot);
      const result = await manager.transitionTask(
        input.chainId,
        input.taskId,
        input.newStatus
      );

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error || "Transition failed",
        });
      }

      return result;
    }),

  /**
   * Start a task (todo → in-progress)
   */
  start: publicProcedure
    .input(getTaskInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getTaskManager(ctx.projectRoot);
      const result = await manager.startTask(input.chainId, input.taskId);

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error || "Failed to start task",
        });
      }

      return result;
    }),

  /**
   * Complete a task (in-progress → in-review)
   */
  complete: publicProcedure
    .input(getTaskInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getTaskManager(ctx.projectRoot);
      const result = await manager.completeTask(input.chainId, input.taskId);

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error || "Failed to complete task",
        });
      }

      return result;
    }),

  /**
   * Approve a task (in-review → done)
   */
  approve: publicProcedure
    .input(getTaskInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getTaskManager(ctx.projectRoot);
      const result = await manager.approveTask(input.chainId, input.taskId);

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error || "Failed to approve task",
        });
      }

      return result;
    }),

  /**
   * Send task back for rework (in-review → in-progress)
   */
  rework: publicProcedure
    .input(reworkTaskInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getTaskManager(ctx.projectRoot);
      const result = await manager.reworkTask(
        input.chainId,
        input.taskId,
        input.reason
      );

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error || "Failed to send task for rework",
        });
      }

      return result;
    }),

  /**
   * Block a task (any status → blocked)
   */
  block: publicProcedure
    .input(getTaskInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getTaskManager(ctx.projectRoot);
      const result = await manager.blockTask(input.chainId, input.taskId);

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error || "Failed to block task",
        });
      }

      return result;
    }),

  /**
   * Unblock a task (blocked → todo)
   */
  unblock: publicProcedure
    .input(getTaskInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getTaskManager(ctx.projectRoot);
      const result = await manager.unblockTask(input.chainId, input.taskId);

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error || "Failed to unblock task",
        });
      }

      return result;
    }),

  /**
   * Get task history (status transitions from pipeline events)
   *
   * Returns a list of status transition events for a task, derived from
   * the MetricsCollector pipeline events. Each entry includes the event type,
   * timestamp, and optional metadata like rework reason.
   */
  getHistory: publicProcedure
    .input(getTaskInputSchema)
    .query(async ({ ctx, input }) => {
      const collector = getMetricsCollector(ctx.projectRoot);

      // Get all events for this task
      const events = await collector.getEvents({
        chainId: input.chainId,
      });

      // Filter to events for this specific task and map to history entries
      const taskEvents = events
        .filter(
          (event) =>
            event.entityType === "task" && event.entityId === input.taskId
        )
        .map((event) => ({
          id: event.id,
          eventType: event.eventType,
          timestamp: event.timestamp,
          metadata: event.metadata,
        }))
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

      return taskEvents;
    }),
});
