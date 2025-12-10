// ADR: ADR-011-web-api-architecture

/**
 * Chains tRPC Router
 *
 * Exposes chain management functionality from @choragen/core to the web dashboard.
 * Provides full CRUD operations for chains and task management within chains.
 */
import { z } from "zod";
import { router, publicProcedure, TRPCError } from "../trpc";
import { ChainManager } from "@choragen/core";

/**
 * Zod schema for chain type
 */
const chainTypeSchema = z.enum(["design", "implementation"]).optional();

/**
 * Zod schema for creating a new chain
 */
const createChainInputSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  slug: z.string().min(1, "Slug is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: chainTypeSchema,
  dependsOn: z.string().optional(),
  skipDesign: z.boolean().optional(),
  skipDesignJustification: z.string().optional(),
});

/**
 * Zod schema for updating a chain
 */
const updateChainInputSchema = z.object({
  chainId: z.string().min(1, "Chain ID is required"),
  updates: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    requestId: z.string().min(1).optional(),
    type: chainTypeSchema,
    dependsOn: z.string().optional(),
    skipDesign: z.boolean().optional(),
    skipDesignJustification: z.string().optional(),
  }),
});

/**
 * Zod schema for adding a task to a chain
 */
const addTaskInputSchema = z.object({
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
 * Zod schema for reordering tasks in a chain
 */
const reorderTasksInputSchema = z.object({
  chainId: z.string().min(1, "Chain ID is required"),
  taskIds: z.array(z.string().min(1)).min(1, "At least one task ID is required"),
});

/**
 * Zod schema for deleting a task from a chain
 */
const deleteTaskInputSchema = z.object({
  chainId: z.string().min(1, "Chain ID is required"),
  taskId: z.string().min(1, "Task ID is required"),
});

/**
 * Helper to create a ChainManager instance from context
 */
function getChainManager(projectRoot: string): ChainManager {
  return new ChainManager(projectRoot);
}

/**
 * Chains router with full CRUD operations
 */
export const chainsRouter = router({
  /**
   * List all chains
   */
  list: publicProcedure.query(async ({ ctx }) => {
    const manager = getChainManager(ctx.projectRoot);
    return manager.getAllChains();
  }),

  /**
   * Get a single chain by ID
   */
  get: publicProcedure
    .input(z.string().min(1, "Chain ID is required"))
    .query(async ({ ctx, input }) => {
      const manager = getChainManager(ctx.projectRoot);
      const chain = await manager.getChain(input);

      if (!chain) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Chain not found: ${input}`,
        });
      }

      return chain;
    }),

  /**
   * Get chain summary with task counts and progress
   */
  getSummary: publicProcedure
    .input(z.string().min(1, "Chain ID is required"))
    .query(async ({ ctx, input }) => {
      const manager = getChainManager(ctx.projectRoot);
      const summary = await manager.getChainSummary(input);

      if (!summary) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Chain not found: ${input}`,
        });
      }

      return summary;
    }),

  /**
   * Create a new chain
   */
  create: publicProcedure
    .input(createChainInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getChainManager(ctx.projectRoot);
      return manager.createChain(input);
    }),

  /**
   * Update chain metadata
   */
  update: publicProcedure
    .input(updateChainInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getChainManager(ctx.projectRoot);
      const chain = await manager.updateChain(input.chainId, input.updates);

      if (!chain) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Chain not found: ${input.chainId}`,
        });
      }

      return chain;
    }),

  /**
   * Delete a chain and all its tasks
   */
  delete: publicProcedure
    .input(z.string().min(1, "Chain ID is required"))
    .mutation(async ({ ctx, input }) => {
      const manager = getChainManager(ctx.projectRoot);
      const deleted = await manager.deleteChain(input);

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Chain not found: ${input}`,
        });
      }

      return { success: true, chainId: input };
    }),

  /**
   * Add a task to a chain
   */
  addTask: publicProcedure
    .input(addTaskInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getChainManager(ctx.projectRoot);

      // Verify chain exists first
      const chain = await manager.getChain(input.chainId);
      if (!chain) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Chain not found: ${input.chainId}`,
        });
      }

      const { chainId, ...taskOptions } = input;
      return manager.addTask(chainId, taskOptions);
    }),

  /**
   * Get the next available task for a chain
   */
  getNextTask: publicProcedure
    .input(z.string().min(1, "Chain ID is required"))
    .query(async ({ ctx, input }) => {
      const manager = getChainManager(ctx.projectRoot);

      // Verify chain exists first
      const chain = await manager.getChain(input);
      if (!chain) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Chain not found: ${input}`,
        });
      }

      return manager.getNextTask(input);
    }),

  /**
   * Reorder tasks in a chain
   */
  reorderTasks: publicProcedure
    .input(reorderTasksInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getChainManager(ctx.projectRoot);

      // Verify chain exists first
      const chain = await manager.getChain(input.chainId);
      if (!chain) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Chain not found: ${input.chainId}`,
        });
      }

      try {
        const updatedChain = await manager.reorderTasks(
          input.chainId,
          input.taskIds
        );
        if (!updatedChain) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to reorder tasks",
          });
        }
        return updatedChain;
      } catch (error) {
        if (error instanceof Error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        throw error;
      }
    }),

  /**
   * Delete a task from a chain
   */
  deleteTask: publicProcedure
    .input(deleteTaskInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getChainManager(ctx.projectRoot);

      // Verify chain exists first
      const chain = await manager.getChain(input.chainId);
      if (!chain) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Chain not found: ${input.chainId}`,
        });
      }

      // Verify task exists
      const task = chain.tasks.find((t) => t.id === input.taskId);
      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Task not found: ${input.taskId}`,
        });
      }

      const deleted = await manager.deleteTask(input.chainId, input.taskId);
      if (!deleted) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete task",
        });
      }

      return { success: true, chainId: input.chainId, taskId: input.taskId };
    }),
});
