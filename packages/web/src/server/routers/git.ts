// ADR: ADR-011-web-api-architecture

/**
 * Git tRPC Router
 *
 * Exposes git operations to the web dashboard for status display,
 * staging/unstaging files, committing changes, and viewing history.
 * Uses simple-git library for git operations.
 */
import { z } from "zod";
import { router, publicProcedure, TRPCError } from "../trpc";
import simpleGit, { SimpleGit, StatusResult, LogResult } from "simple-git";

/**
 * Zod schema for staging/unstaging files
 */
const filesInputSchema = z.object({
  files: z.array(z.string().min(1)).min(1, "At least one file is required"),
});

/**
 * Zod schema for commit
 */
const commitInputSchema = z.object({
  message: z.string().min(1, "Commit message is required"),
  requestId: z.string().optional(),
});

/**
 * Zod schema for log
 */
const logInputSchema = z.object({
  limit: z.number().int().positive().max(100).default(10),
});

/**
 * Git status response type
 */
interface GitStatusResponse {
  branch: string;
  staged: string[];
  modified: string[];
  untracked: string[];
}

/**
 * Git log entry type
 */
interface GitLogEntry {
  hash: string;
  date: string;
  message: string;
  author: string;
}

/**
 * Helper to create a simple-git instance for the project root
 */
function getGit(projectRoot: string): SimpleGit {
  return simpleGit(projectRoot);
}

/**
 * Parse simple-git status result into our response format
 */
function parseStatus(status: StatusResult): GitStatusResponse {
  return {
    branch: status.current || "HEAD",
    staged: [...status.staged, ...status.renamed.map((r) => r.to)],
    modified: status.modified,
    untracked: status.not_added,
  };
}

/**
 * Parse simple-git log result into our response format
 */
function parseLog(log: LogResult): GitLogEntry[] {
  return log.all.map((entry) => ({
    hash: entry.hash,
    date: entry.date,
    message: entry.message,
    author: entry.author_name,
  }));
}

/**
 * Format commit message with optional request ID
 */
function formatCommitMessage(message: string, requestId?: string): string {
  if (!requestId) {
    return message;
  }
  // Append request ID in brackets if not already present
  if (message.includes(`[${requestId}]`)) {
    return message;
  }
  return `${message}\n\n[${requestId}]`;
}

/**
 * Git router with status, stage, unstage, commit, and log procedures
 */
export const gitRouter = router({
  /**
   * Get git status for the project
   * Returns branch name, staged files, modified files, and untracked files
   */
  status: publicProcedure.query(async ({ ctx }): Promise<GitStatusResponse> => {
    const git = getGit(ctx.projectRoot);

    try {
      const status = await git.status();
      return parseStatus(status);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? `Git status failed: ${error.message}`
            : "Git status failed",
        cause: error,
      });
    }
  }),

  /**
   * Stage files for commit
   */
  stage: publicProcedure
    .input(filesInputSchema)
    .mutation(async ({ ctx, input }): Promise<{ success: true; files: string[] }> => {
      const git = getGit(ctx.projectRoot);

      try {
        await git.add(input.files);
        return { success: true, files: input.files };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? `Git stage failed: ${error.message}`
              : "Git stage failed",
          cause: error,
        });
      }
    }),

  /**
   * Unstage files (remove from staging area)
   */
  unstage: publicProcedure
    .input(filesInputSchema)
    .mutation(async ({ ctx, input }): Promise<{ success: true; files: string[] }> => {
      const git = getGit(ctx.projectRoot);

      try {
        // Use reset HEAD to unstage files
        await git.reset(["HEAD", "--", ...input.files]);
        return { success: true, files: input.files };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? `Git unstage failed: ${error.message}`
              : "Git unstage failed",
          cause: error,
        });
      }
    }),

  /**
   * Commit staged changes
   * Commit hooks (pre-commit, commit-msg) will still run
   */
  commit: publicProcedure
    .input(commitInputSchema)
    .mutation(async ({ ctx, input }): Promise<{ success: true; hash: string }> => {
      const git = getGit(ctx.projectRoot);

      try {
        const message = formatCommitMessage(input.message, input.requestId);
        const result = await git.commit(message);

        if (!result.commit) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Nothing to commit or commit was rejected by hooks",
          });
        }

        return { success: true, hash: result.commit };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? `Git commit failed: ${error.message}`
              : "Git commit failed",
          cause: error,
        });
      }
    }),

  /**
   * Get commit history
   */
  log: publicProcedure
    .input(logInputSchema)
    .query(async ({ ctx, input }): Promise<GitLogEntry[]> => {
      const git = getGit(ctx.projectRoot);

      try {
        const log = await git.log({ maxCount: input.limit });
        return parseLog(log);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? `Git log failed: ${error.message}`
              : "Git log failed",
          cause: error,
        });
      }
    }),
});
