// ADR: ADR-011-web-api-architecture

/**
 * Requests tRPC Router
 *
 * Exposes request (CR/FR) management functionality to the web dashboard.
 * Implements file-based operations directly since there's no RequestManager in @choragen/core.
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
const requestStatusSchema = z.enum(["backlog", "todo", "doing", "done"]);
type RequestStatus = z.infer<typeof requestStatusSchema>;

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
 * Parsed request metadata
 */
interface RequestMetadata {
  id: string;
  type: RequestType;
  title: string;
  domain: string;
  status: RequestStatus;
  created: string;
  owner?: string;
  severity?: string; // Only for fix requests
  tags: string[];
  filename: string;
}

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
 * Parse request metadata from markdown content
 */
function parseRequestMetadata(
  content: string,
  filename: string,
  type: RequestType,
  status: RequestStatus
): RequestMetadata | null {
  // Extract title from first heading
  const titleMatch = content.match(/^#\s+(?:Change Request|Fix Request):\s*(.+)$/m);
  const title = titleMatch?.[1]?.trim() || filename.replace(".md", "");

  // Extract metadata fields
  const idMatch = content.match(/\*\*ID\*\*:\s*(\S+)/);
  const domainMatch = content.match(/\*\*Domain\*\*:\s*(\S+)/);
  const createdMatch = content.match(/\*\*Created\*\*:\s*(\S+)/);
  const ownerMatch = content.match(/\*\*Owner\*\*:\s*(\S+)/);
  const severityMatch = content.match(/\*\*Severity\*\*:\s*(\S+)/);
  // Tags can contain spaces and commas, so match until end of line
  const tagsMatch = content.match(/\*\*Tags\*\*:\s*(.+?)(?:\s{2}|\n|$)/);

  const id = idMatch?.[1];
  if (!id) {
    return null;
  }

  return {
    id,
    type,
    title,
    domain: domainMatch?.[1] || "unknown",
    status,
    created: createdMatch?.[1] || "",
    owner: ownerMatch?.[1],
    severity: severityMatch?.[1],
    tags: parseTags(tagsMatch?.[1]),
    filename,
  };
}

/**
 * Read all requests from a specific type and status directory
 */
async function readRequestsFromDir(
  projectRoot: string,
  type: RequestType,
  status: RequestStatus
): Promise<RequestMetadata[]> {
  const dirPath = path.join(
    getRequestsDir(projectRoot),
    REQUEST_DIRS[type],
    status
  );

  try {
    const files = await fs.readdir(dirPath);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    const requests: RequestMetadata[] = [];
    for (const filename of mdFiles) {
      const filePath = path.join(dirPath, filename);
      const content = await fs.readFile(filePath, "utf-8");
      const metadata = parseRequestMetadata(content, filename, type, status);
      if (metadata) {
        requests.push(metadata);
      }
    }

    return requests;
  } catch (error) {
    // Directory doesn't exist or can't be read
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

/**
 * Find a request by ID across all directories
 */
async function findRequestById(
  projectRoot: string,
  requestId: string
): Promise<{ metadata: RequestMetadata; content: string; filePath: string } | null> {
  const types: RequestType[] = ["change-request", "fix-request"];
  const statuses: RequestStatus[] = ["backlog", "todo", "doing", "done"];

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
          const metadata = parseRequestMetadata(content, filename, type, status);

          if (metadata?.id === requestId) {
            return { metadata, content, filePath };
          }
        }
      } catch {
        // Directory doesn't exist, continue
      }
    }
  }

  return null;
}

/**
 * Zod schema for list filters
 */
const listFiltersSchema = z.object({
  status: requestStatusSchema.optional(),
}).optional();

/**
 * Zod schema for update status mutation
 */
const updateStatusInputSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  newStatus: requestStatusSchema,
});

/**
 * Requests router with file-based operations
 */
export const requestsRouter = router({
  /**
   * List all requests (both CRs and FRs)
   */
  list: publicProcedure
    .input(listFiltersSchema)
    .query(async ({ ctx, input }) => {
      const statuses: RequestStatus[] = input?.status
        ? [input.status]
        : ["backlog", "todo", "doing", "done"];

      const allRequests: RequestMetadata[] = [];

      for (const status of statuses) {
        const crs = await readRequestsFromDir(ctx.projectRoot, "change-request", status);
        const frs = await readRequestsFromDir(ctx.projectRoot, "fix-request", status);
        allRequests.push(...crs, ...frs);
      }

      // Sort by created date descending
      return allRequests.sort((a, b) => b.created.localeCompare(a.created));
    }),

  /**
   * List change requests only
   */
  listChangeRequests: publicProcedure
    .input(listFiltersSchema)
    .query(async ({ ctx, input }) => {
      const statuses: RequestStatus[] = input?.status
        ? [input.status]
        : ["backlog", "todo", "doing", "done"];

      const requests: RequestMetadata[] = [];

      for (const status of statuses) {
        const crs = await readRequestsFromDir(ctx.projectRoot, "change-request", status);
        requests.push(...crs);
      }

      return requests.sort((a, b) => b.created.localeCompare(a.created));
    }),

  /**
   * List fix requests only
   */
  listFixRequests: publicProcedure
    .input(listFiltersSchema)
    .query(async ({ ctx, input }) => {
      const statuses: RequestStatus[] = input?.status
        ? [input.status]
        : ["backlog", "todo", "doing", "done"];

      const requests: RequestMetadata[] = [];

      for (const status of statuses) {
        const frs = await readRequestsFromDir(ctx.projectRoot, "fix-request", status);
        requests.push(...frs);
      }

      return requests.sort((a, b) => b.created.localeCompare(a.created));
    }),

  /**
   * Get a single request by ID
   */
  get: publicProcedure
    .input(z.string().min(1, "Request ID is required"))
    .query(async ({ ctx, input }) => {
      const result = await findRequestById(ctx.projectRoot, input);

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Request not found: ${input}`,
        });
      }

      return result.metadata;
    }),

  /**
   * Get raw markdown content for a request
   */
  getContent: publicProcedure
    .input(z.string().min(1, "Request ID is required"))
    .query(async ({ ctx, input }) => {
      const result = await findRequestById(ctx.projectRoot, input);

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Request not found: ${input}`,
        });
      }

      return {
        metadata: result.metadata,
        content: result.content,
      };
    }),

  /**
   * Update request status (moves file between directories)
   */
  updateStatus: publicProcedure
    .input(updateStatusInputSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await findRequestById(ctx.projectRoot, input.requestId);

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Request not found: ${input.requestId}`,
        });
      }

      const { metadata, content, filePath } = result;

      // If status is already the target, no-op
      if (metadata.status === input.newStatus) {
        return { success: true, metadata };
      }

      // Calculate new file path
      const newDirPath = path.join(
        getRequestsDir(ctx.projectRoot),
        REQUEST_DIRS[metadata.type],
        input.newStatus
      );
      const newFilePath = path.join(newDirPath, metadata.filename);

      // Update status in content
      const updatedContent = content.replace(
        /(\*\*Status\*\*:\s*)\S+/,
        `$1${input.newStatus}`
      );

      // Ensure target directory exists
      await fs.mkdir(newDirPath, { recursive: true });

      // Write to new location
      await fs.writeFile(newFilePath, updatedContent, "utf-8");

      // Remove from old location
      await fs.unlink(filePath);

      return {
        success: true,
        metadata: {
          ...metadata,
          status: input.newStatus,
        },
      };
    }),

  /**
   * Add a tag to a request
   */
  addTag: publicProcedure
    .input(
      z.object({
        requestId: z.string().min(1, "Request ID is required"),
        tag: z.string().min(1, "Tag is required").transform((t) => t.trim().toLowerCase()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await findRequestById(ctx.projectRoot, input.requestId);

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Request not found: ${input.requestId}`,
        });
      }

      const { metadata, content, filePath } = result;

      // Check if tag already exists
      if (metadata.tags.includes(input.tag)) {
        return { success: true, metadata };
      }

      // Add tag to the list
      const newTags = [...metadata.tags, input.tag];
      const tagsString = newTags.join(", ");

      let updatedContent: string;
      if (content.match(/\*\*Tags\*\*:/)) {
        // Update existing Tags line
        updatedContent = content.replace(
          /\*\*Tags\*\*:\s*.*/,
          `**Tags**: ${tagsString}`
        );
      } else {
        // Insert Tags line after Status (or after Owner if present)
        const insertAfterPattern = /(\*\*(?:Owner|Status)\*\*:\s*\S+\s*)/;
        updatedContent = content.replace(
          insertAfterPattern,
          `$1\n**Tags**: ${tagsString}  `
        );
      }

      await fs.writeFile(filePath, updatedContent, "utf-8");

      return {
        success: true,
        metadata: {
          ...metadata,
          tags: newTags,
        },
      };
    }),

  /**
   * Remove a tag from a request
   */
  removeTag: publicProcedure
    .input(
      z.object({
        requestId: z.string().min(1, "Request ID is required"),
        tag: z.string().min(1, "Tag is required").transform((t) => t.trim().toLowerCase()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await findRequestById(ctx.projectRoot, input.requestId);

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Request not found: ${input.requestId}`,
        });
      }

      const { metadata, content, filePath } = result;

      // Check if tag exists
      if (!metadata.tags.includes(input.tag)) {
        return { success: true, metadata };
      }

      // Remove tag from the list
      const newTags = metadata.tags.filter((t) => t !== input.tag);

      let updatedContent: string;
      if (newTags.length === 0) {
        // Remove the entire Tags line if no tags left
        updatedContent = content.replace(/\*\*Tags\*\*:\s*.*\n?/, "");
      } else {
        // Update Tags line with remaining tags
        const tagsString = newTags.join(", ");
        updatedContent = content.replace(
          /\*\*Tags\*\*:\s*.*/,
          `**Tags**: ${tagsString}`
        );
      }

      await fs.writeFile(filePath, updatedContent, "utf-8");

      return {
        success: true,
        metadata: {
          ...metadata,
          tags: newTags,
        },
      };
    }),
});
