// ADR: ADR-011-web-api-architecture

/**
 * Tags tRPC Router
 *
 * Provides tag management functionality for requests.
 * Tags are stored in request markdown files, not a separate database.
 */
import { z } from "zod";
import { router, publicProcedure, TRPCError } from "../trpc";
import * as fs from "fs/promises";
import * as path from "path";

/**
 * Request type enum
 */
type RequestType = "change-request" | "fix-request";

/**
 * Request status enum
 */
type RequestStatus = "todo" | "doing" | "done";

/**
 * Directory names for request types
 */
const REQUEST_DIRS: Record<RequestType, string> = {
  "change-request": "change-requests",
  "fix-request": "fix-requests",
};

/**
 * Get the requests base directory
 */
function getRequestsDir(projectRoot: string): string {
  return path.join(projectRoot, "docs", "requests");
}

/**
 * Parse comma-separated tags from a string
 */
function parseTags(tagsString: string | undefined): string[] {
  if (!tagsString) return [];
  return tagsString
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);
}

/**
 * Extract tags from markdown content
 */
function extractTags(content: string): string[] {
  const tagsMatch = content.match(/\*\*Tags\*\*:\s*(.+?)(?:\s{2}|\n|$)/);
  return parseTags(tagsMatch?.[1]);
}

/**
 * Scan all requests and collect unique tags
 */
async function collectAllTags(projectRoot: string): Promise<string[]> {
  const types: RequestType[] = ["change-request", "fix-request"];
  const statuses: RequestStatus[] = ["todo", "doing", "done"];
  const allTags = new Set<string>();

  for (const type of types) {
    for (const status of statuses) {
      const dirPath = path.join(
        getRequestsDir(projectRoot),
        REQUEST_DIRS[type],
        status
      );

      try {
        const files = await fs.readdir(dirPath);
        for (const filename of files) {
          if (!filename.endsWith(".md")) continue;

          const filePath = path.join(dirPath, filename);
          const content = await fs.readFile(filePath, "utf-8");
          const tags = extractTags(content);
          tags.forEach((tag) => allTags.add(tag));
        }
      } catch {
        // Directory doesn't exist, continue
      }
    }
  }

  return Array.from(allTags).sort();
}

/**
 * Rename a tag across all requests
 */
async function renameTagInAllRequests(
  projectRoot: string,
  oldTag: string,
  newTag: string
): Promise<number> {
  const types: RequestType[] = ["change-request", "fix-request"];
  const statuses: RequestStatus[] = ["todo", "doing", "done"];
  let updatedCount = 0;

  for (const type of types) {
    for (const status of statuses) {
      const dirPath = path.join(
        getRequestsDir(projectRoot),
        REQUEST_DIRS[type],
        status
      );

      try {
        const files = await fs.readdir(dirPath);
        for (const filename of files) {
          if (!filename.endsWith(".md")) continue;

          const filePath = path.join(dirPath, filename);
          const content = await fs.readFile(filePath, "utf-8");
          const tags = extractTags(content);

          if (tags.includes(oldTag)) {
            // Replace old tag with new tag
            const newTags = tags.map((t) => (t === oldTag ? newTag : t));
            // Remove duplicates (in case newTag already existed)
            const uniqueTags = [...new Set(newTags)];
            const tagsString = uniqueTags.join(", ");

            const updatedContent = content.replace(
              /\*\*Tags\*\*:\s*.*/,
              `**Tags**: ${tagsString}`
            );

            await fs.writeFile(filePath, updatedContent, "utf-8");
            updatedCount++;
          }
        }
      } catch {
        // Directory doesn't exist, continue
      }
    }
  }

  return updatedCount;
}

/**
 * Tags router with tag management operations
 */
export const tagsRouter = router({
  /**
   * List all unique tags across all requests
   */
  list: publicProcedure.query(async ({ ctx }) => {
    const tags = await collectAllTags(ctx.projectRoot);
    return tags;
  }),

  /**
   * Rename a tag across all requests
   */
  rename: publicProcedure
    .input(
      z.object({
        oldTag: z.string().min(1, "Old tag is required").transform((t) => t.trim().toLowerCase()),
        newTag: z.string().min(1, "New tag is required").transform((t) => t.trim().toLowerCase()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.oldTag === input.newTag) {
        return { success: true, updatedCount: 0 };
      }

      // Check if old tag exists
      const allTags = await collectAllTags(ctx.projectRoot);
      if (!allTags.includes(input.oldTag)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Tag not found: ${input.oldTag}`,
        });
      }

      const updatedCount = await renameTagInAllRequests(
        ctx.projectRoot,
        input.oldTag,
        input.newTag
      );

      return { success: true, updatedCount };
    }),
});
