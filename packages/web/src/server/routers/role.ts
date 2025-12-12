// ADR: ADR-011-web-api-architecture

/**
 * Role tRPC Router
 *
 * Exposes RoleManager CRUD operations to the web dashboard.
 * Roles are stored in .choragen/roles/index.yaml and define tool access.
 */
import { z } from "zod";
import { router, publicProcedure, TRPCError } from "../trpc";
import { RoleManager } from "@choragen/core";

const createRoleInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  toolIds: z
    .array(z.string().min(1, "Tool ID is required"))
    .min(1, "At least one tool is required"),
});

const updateRoleInputSchema = z.object({
  id: z.string().min(1, "Role ID is required"),
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  toolIds: z.array(z.string().min(1, "Tool ID is required")).optional(),
});

function getRoleManager(projectRoot: string): RoleManager {
  return new RoleManager(projectRoot);
}

export const roleRouter = router({
  /**
   * List all roles
   */
  list: publicProcedure.query(async ({ ctx }) => {
    const manager = getRoleManager(ctx.projectRoot);
    return manager.list();
  }),

  /**
   * Get a single role by ID
   */
  get: publicProcedure
    .input(z.string().min(1, "Role ID is required"))
    .query(async ({ ctx, input }) => {
      const manager = getRoleManager(ctx.projectRoot);
      const role = await manager.get(input);

      if (!role) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Role not found: ${input}`,
        });
      }

      return role;
    }),

  /**
   * Create a new role
   */
  create: publicProcedure
    .input(createRoleInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getRoleManager(ctx.projectRoot);

      try {
        return await manager.create(input);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error
              ? error.message
              : "Failed to create role",
        });
      }
    }),

  /**
   * Update an existing role
   */
  update: publicProcedure
    .input(updateRoleInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getRoleManager(ctx.projectRoot);

      try {
        return await manager.update(input.id, {
          name: input.name,
          description: input.description,
          toolIds: input.toolIds,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update role";
        const isNotFound =
          error instanceof Error && error.message.toLowerCase().includes("not found");

        throw new TRPCError({
          code: isNotFound ? "NOT_FOUND" : "BAD_REQUEST",
          message,
        });
      }
    }),

  /**
   * Delete a role by ID
   */
  delete: publicProcedure
    .input(z.string().min(1, "Role ID is required"))
    .mutation(async ({ ctx, input }) => {
      const manager = getRoleManager(ctx.projectRoot);

      try {
        await manager.delete(input);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete role";
        const isNotFound =
          error instanceof Error && error.message.toLowerCase().includes("not found");

        throw new TRPCError({
          code: isNotFound ? "NOT_FOUND" : "BAD_REQUEST",
          message,
        });
      }

      return { success: true, id: input };
    }),
});
