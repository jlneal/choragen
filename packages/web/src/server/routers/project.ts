// ADR: ADR-011-web-api-architecture

/**
 * Project tRPC Router
 *
 * Validates project directories and confirms project switches from the client.
 * Ensures only directories with a .choragen folder are accepted.
 */
import * as fs from "fs/promises";
import * as path from "path";
import { z } from "zod";
import { router, publicProcedure, TRPCError } from "../trpc";

interface ProjectValidationResult {
  valid: boolean;
  name: string;
  projectRoot: string;
  error?: string;
}

const projectInputSchema = z.object({
  path: z.string().min(1, "Project path is required"),
});

async function validateProjectPath(projectPath: string): Promise<ProjectValidationResult> {
  const resolvedPath = path.resolve(projectPath);
  const name = path.basename(resolvedPath);

  try {
    const stats = await fs.stat(resolvedPath);
    if (!stats.isDirectory()) {
      return {
        valid: false,
        name,
        projectRoot: resolvedPath,
        error: "Project path must be a directory",
      };
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        valid: false,
        name,
        projectRoot: resolvedPath,
        error: "Project path does not exist",
      };
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to validate project path",
      cause: error,
    });
  }

  const choragenPath = path.join(resolvedPath, ".choragen");
  try {
    const choragenStats = await fs.stat(choragenPath);
    if (!choragenStats.isDirectory()) {
      return {
        valid: false,
        name,
        projectRoot: resolvedPath,
        error: "Project directory is missing .choragen folder",
      };
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        valid: false,
        name,
        projectRoot: resolvedPath,
        error: "Project directory is missing .choragen folder",
      };
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to validate .choragen folder",
      cause: error,
    });
  }

  return {
    valid: true,
    name,
    projectRoot: resolvedPath,
  };
}

/**
 * Project router providing validation and switching helpers.
 */
export const projectRouter = router({
  /**
   * Validate that a project directory exists and contains .choragen.
   */
  validate: publicProcedure
    .input(projectInputSchema)
    .query(async ({ input }) => {
      const validation = await validateProjectPath(input.path);

      return {
        valid: validation.valid,
        name: validation.name,
        error: validation.error,
      };
    }),

  /**
   * Confirm a project switch by validating the requested path.
   * Returns success/failure with optional error messaging.
   */
  switch: publicProcedure
    .input(projectInputSchema)
    .mutation(async ({ input }) => {
      const validation = await validateProjectPath(input.path);

      if (!validation.valid) {
        return {
          success: false,
          name: validation.name,
          error: validation.error,
        };
      }

      return {
        success: true,
        name: validation.name,
        projectRoot: validation.projectRoot,
      };
    }),
});
