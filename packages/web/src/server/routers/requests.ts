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
 * Zod schema for create request input
 */
const createRequestInputSchema = z.object({
  type: z.enum(["cr", "fr"]),
  title: z.string().min(1, "Title is required"),
  domain: z.string().min(1, "Domain is required"),
  description: z.string().optional(),
  owner: z.string().optional(),
  severity: z.enum(["high", "medium", "low"]).optional(),
});

/**
 * Generate a slug from a title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50)
    .replace(/-$/, "");
}

/**
 * Get today's date in YYYYMMDD format
 */
function getDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getFormattedDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Find the next available sequence number for a given date and type
 */
async function findNextSequence(
  projectRoot: string,
  type: "cr" | "fr",
  dateString: string
): Promise<string> {
  const prefix = type === "cr" ? "CR" : "FR";
  const pattern = new RegExp(`^${prefix}-${dateString}-(\\d{3})`);
  
  const requestType: RequestType = type === "cr" ? "change-request" : "fix-request";
  const statuses: RequestStatus[] = ["backlog", "todo", "doing", "done"];
  
  let maxSeq = 0;
  
  for (const status of statuses) {
    const dirPath = path.join(
      getRequestsDir(projectRoot),
      REQUEST_DIRS[requestType],
      status
    );
    
    try {
      const files = await fs.readdir(dirPath);
      for (const filename of files) {
        const match = filename.match(pattern);
        if (match) {
          const seq = parseInt(match[1], 10);
          if (seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    } catch {
      // Directory doesn't exist, continue
    }
  }
  
  return String(maxSeq + 1).padStart(3, "0");
}

/**
 * Generate markdown content for a Change Request
 */
function generateCRContent(
  id: string,
  title: string,
  domain: string,
  formattedDate: string,
  description?: string,
  owner?: string
): string {
  return `# Change Request: ${title}

**ID**: ${id}  
**Domain**: ${domain}  
**Status**: todo  
**Created**: ${formattedDate}  
**Owner**: ${owner || "agent"}  

---

## What

${description || "{{DESCRIPTION}}"}

---

## Why

{{MOTIVATION}}

---

## Scope

**In Scope**:
- {{IN_SCOPE_1}}

**Out of Scope**:
- {{OUT_OF_SCOPE_1}}

---

## Affected Design Documents

- {{DESIGN_DOC_1}}

---

## Linked ADRs

- {{ADR_1}}

---

## Commits

No commits yet.

---

## Implementation Notes

{{NOTES}}

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
`;
}

/**
 * Generate markdown content for a Fix Request
 */
function generateFRContent(
  id: string,
  title: string,
  domain: string,
  formattedDate: string,
  description?: string,
  owner?: string,
  severity?: string
): string {
  return `# Fix Request: ${title}

**ID**: ${id}  
**Domain**: ${domain}  
**Status**: todo  
**Created**: ${formattedDate}  
**Severity**: ${severity || "medium"}  
**Owner**: ${owner || "agent"}  

---

## Problem

${description || "{{PROBLEM_DESCRIPTION}}"}

---

## Expected Behavior

{{EXPECTED}}

---

## Actual Behavior

{{ACTUAL}}

---

## Steps to Reproduce

1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}

---

## Root Cause Analysis

{{ROOT_CAUSE}}

---

## Proposed Fix

{{PROPOSED_FIX}}

---

## Affected Files

- {{FILE_1}}

---

## Linked ADRs

- {{ADR_1}}

---

## Commits

No commits yet.

---

## Verification

- [ ] Bug no longer reproducible
- [ ] Regression test added
- [ ] Related functionality still works

---

## Completion Notes

[Added when moved to done/]
`;
}

/**
 * Zod schema for update status mutation
 */
const updateStatusInputSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  newStatus: requestStatusSchema,
});

/**
 * Zod schema for update request mutation
 */
const updateRequestInputSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  updates: z.object({
    title: z.string().min(1).optional(),
    domain: z.string().min(1).optional(),
    description: z.string().optional(),
    scope: z.object({
      inScope: z.array(z.string()).optional(),
      outOfScope: z.array(z.string()).optional(),
    }).optional(),
  }),
});

/**
 * Update the title in markdown content (the heading)
 */
function updateTitle(content: string, newTitle: string, type: RequestType): string {
  const prefix = type === "change-request" ? "Change Request" : "Fix Request";
  return content.replace(
    new RegExp(`^(#\\s+${prefix}:\\s*).+$`, "m"),
    `$1${newTitle}`
  );
}

/**
 * Update a metadata field in markdown content
 */
function updateMetadataField(content: string, field: string, value: string): string {
  const pattern = new RegExp(`(\\*\\*${field}\\*\\*:\\s*)\\S+`);
  return content.replace(pattern, `$1${value}`);
}

/**
 * Update the description/What section in markdown content
 */
function updateDescriptionSection(content: string, description: string, type: RequestType): string {
  // For CRs, the section is "## What", for FRs it's "## Problem"
  const sectionName = type === "change-request" ? "What" : "Problem";
  
  // Match from section header to next section (---) or end
  const pattern = new RegExp(
    `(## ${sectionName}\\s*\\n\\n)([\\s\\S]*?)(\\n---\\n|$)`,
    "m"
  );
  
  return content.replace(pattern, `$1${description}\n$3`);
}

/**
 * Update the Scope section in markdown content (CR only)
 */
function updateScopeSection(
  content: string,
  scope: { inScope?: string[]; outOfScope?: string[] }
): string {
  // Build the new scope content
  const inScopeItems = scope.inScope && scope.inScope.length > 0
    ? scope.inScope.map((item) => `- ${item}`).join("\n")
    : "- {{IN_SCOPE_1}}";
  
  const outOfScopeItems = scope.outOfScope && scope.outOfScope.length > 0
    ? scope.outOfScope.map((item) => `- ${item}`).join("\n")
    : "- {{OUT_OF_SCOPE_1}}";
  
  const newScopeContent = `**In Scope**:\n${inScopeItems}\n\n**Out of Scope**:\n${outOfScopeItems}`;
  
  // Match the entire Scope section
  const pattern = /## Scope\s*\n\n[\s\S]*?(?=\n---\n|$)/m;
  
  return content.replace(pattern, `## Scope\n\n${newScopeContent}`);
}

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
   * Create a new request (CR or FR)
   */
  create: publicProcedure
    .input(createRequestInputSchema)
    .mutation(async ({ ctx, input }) => {
      const dateString = getDateString();
      const formattedDate = getFormattedDate();
      const seq = await findNextSequence(ctx.projectRoot, input.type, dateString);
      
      const prefix = input.type === "cr" ? "CR" : "FR";
      const id = `${prefix}-${dateString}-${seq}`;
      const slug = generateSlug(input.title);
      const filename = `${id}-${slug}.md`;
      
      const requestType: RequestType = input.type === "cr" ? "change-request" : "fix-request";
      const dirPath = path.join(
        getRequestsDir(ctx.projectRoot),
        REQUEST_DIRS[requestType],
        "todo"
      );
      
      // Generate content based on type
      const content = input.type === "cr"
        ? generateCRContent(id, input.title, input.domain, formattedDate, input.description, input.owner)
        : generateFRContent(id, input.title, input.domain, formattedDate, input.description, input.owner, input.severity);
      
      // Ensure directory exists
      await fs.mkdir(dirPath, { recursive: true });
      
      // Write file
      const filePath = path.join(dirPath, filename);
      await fs.writeFile(filePath, content, "utf-8");
      
      // Return created metadata
      const metadata: RequestMetadata = {
        id,
        type: requestType,
        title: input.title,
        domain: input.domain,
        status: "todo",
        created: formattedDate,
        owner: input.owner || "agent",
        severity: input.type === "fr" ? (input.severity || "medium") : undefined,
        tags: [],
        filename,
      };
      
      return {
        success: true,
        metadata,
        filePath: path.relative(ctx.projectRoot, filePath),
      };
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
   * Update request content (title, domain, description, scope)
   */
  update: publicProcedure
    .input(updateRequestInputSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await findRequestById(ctx.projectRoot, input.requestId);

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Request not found: ${input.requestId}`,
        });
      }

      const { metadata, filePath } = result;
      let { content } = result;
      const { updates } = input;

      // Track what was updated for the response
      let updatedTitle = metadata.title;
      let updatedDomain = metadata.domain;

      // Update title if provided
      if (updates.title !== undefined) {
        content = updateTitle(content, updates.title, metadata.type);
        updatedTitle = updates.title;
      }

      // Update domain if provided
      if (updates.domain !== undefined) {
        content = updateMetadataField(content, "Domain", updates.domain);
        updatedDomain = updates.domain;
      }

      // Update description if provided
      if (updates.description !== undefined) {
        content = updateDescriptionSection(content, updates.description, metadata.type);
      }

      // Update scope if provided (only for CRs)
      if (updates.scope !== undefined && metadata.type === "change-request") {
        content = updateScopeSection(content, updates.scope);
      }

      // Write updated content back to file
      await fs.writeFile(filePath, content, "utf-8");

      return {
        success: true,
        metadata: {
          ...metadata,
          title: updatedTitle,
          domain: updatedDomain,
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

  /**
   * Promote a request from backlog to todo
   */
  promote: publicProcedure
    .input(z.object({ requestId: z.string().min(1, "Request ID is required") }))
    .mutation(async ({ ctx, input }) => {
      const result = await findRequestById(ctx.projectRoot, input.requestId);

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Request not found: ${input.requestId}`,
        });
      }

      const { metadata, content, filePath } = result;

      // Verify request is in backlog
      if (metadata.status !== "backlog") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Request ${input.requestId} is not in backlog (current status: ${metadata.status})`,
        });
      }

      // Calculate new file path (todo directory)
      const newDirPath = path.join(
        getRequestsDir(ctx.projectRoot),
        REQUEST_DIRS[metadata.type],
        "todo"
      );
      const newFilePath = path.join(newDirPath, metadata.filename);

      // Update status in content
      const updatedContent = content.replace(
        /(\*\*Status\*\*:\s*)\S+/,
        "$1todo"
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
          status: "todo" as RequestStatus,
        },
      };
    }),

  /**
   * Close a request (move from doing to done with completion notes)
   */
  close: publicProcedure
    .input(
      z.object({
        requestId: z.string().min(1, "Request ID is required"),
        completionNotes: z.string().min(1, "Completion notes are required"),
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

      // Verify request is in doing status
      if (metadata.status !== "doing") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Request ${input.requestId} is not in doing status (current status: ${metadata.status}). Only active work can be closed.`,
        });
      }

      // Calculate new file path (done directory)
      const newDirPath = path.join(
        getRequestsDir(ctx.projectRoot),
        REQUEST_DIRS[metadata.type],
        "done"
      );
      const newFilePath = path.join(newDirPath, metadata.filename);

      // Update status in content
      let updatedContent = content.replace(
        /(\*\*Status\*\*:\s*)\S+/,
        "$1done"
      );

      // Update completion notes section
      // Replace the placeholder text with actual completion notes
      updatedContent = updatedContent.replace(
        /## Completion Notes\s*\n\n\[Added when moved to done[^\]]*\]/,
        `## Completion Notes\n\n${input.completionNotes}`
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
          status: "done" as RequestStatus,
        },
        message: `Request ${input.requestId} closed and moved to done/`,
      };
    }),

  /**
   * Demote a request from todo to backlog
   */
  demote: publicProcedure
    .input(z.object({ requestId: z.string().min(1, "Request ID is required") }))
    .mutation(async ({ ctx, input }) => {
      const result = await findRequestById(ctx.projectRoot, input.requestId);

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Request not found: ${input.requestId}`,
        });
      }

      const { metadata, content, filePath } = result;

      // Verify request is in todo
      if (metadata.status !== "todo") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Request ${input.requestId} is not in todo (current status: ${metadata.status})`,
        });
      }

      // Calculate new file path (backlog directory)
      const newDirPath = path.join(
        getRequestsDir(ctx.projectRoot),
        REQUEST_DIRS[metadata.type],
        "backlog"
      );
      const newFilePath = path.join(newDirPath, metadata.filename);

      // Update status in content
      const updatedContent = content.replace(
        /(\*\*Status\*\*:\s*)\S+/,
        "$1backlog"
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
          status: "backlog" as RequestStatus,
        },
      };
    }),

  /**
   * Delete a request permanently
   */
  delete: publicProcedure
    .input(z.object({ requestId: z.string().min(1, "Request ID is required") }))
    .mutation(async ({ ctx, input }) => {
      const result = await findRequestById(ctx.projectRoot, input.requestId);

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Request not found: ${input.requestId}`,
        });
      }

      const { filePath } = result;

      // Delete the file
      await fs.unlink(filePath);

      return {
        success: true,
        deletedId: input.requestId,
      };
    }),
});
