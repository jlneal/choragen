// ADR: ADR-011-web-api-architecture

/**
 * Groups tRPC Router
 *
 * Provides group management functionality for organizing related requests.
 * Groups are stored in .choragen/groups.json file.
 * A request can only belong to ONE group at a time.
 */
import { z } from "zod";
import { router, publicProcedure, TRPCError } from "../trpc";
import * as fs from "fs/promises";
import * as path from "path";

/**
 * Group data structure
 */
interface Group {
  id: string;
  name: string;
  requestIds: string[];
  rank: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Groups file structure
 */
interface GroupsFile {
  groups: Group[];
}

/**
 * Get the groups file path
 */
function getGroupsFilePath(projectRoot: string): string {
  return path.join(projectRoot, ".choragen", "groups.json");
}

/**
 * Read groups from file
 */
async function readGroups(projectRoot: string): Promise<GroupsFile> {
  const filePath = getGroupsFilePath(projectRoot);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as GroupsFile;
  } catch {
    // Return empty groups if file doesn't exist
    return { groups: [] };
  }
}

/**
 * Write groups to file
 */
async function writeGroups(
  projectRoot: string,
  data: GroupsFile
): Promise<void> {
  const filePath = getGroupsFilePath(projectRoot);
  // Ensure .choragen directory exists
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Generate a unique group ID
 * Uses timestamp + random suffix to ensure uniqueness even when called rapidly
 */
function generateGroupId(): string {
  return `grp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Find which group a request belongs to (if any)
 */
function findGroupForRequest(
  groups: Group[],
  requestId: string
): Group | undefined {
  return groups.find((g) => g.requestIds.includes(requestId));
}

/**
 * Request type enum (for tag scanning)
 */
type RequestType = "change-request" | "fix-request";

/**
 * Request status enum (for tag scanning)
 */
type RequestStatus = "backlog" | "todo" | "doing" | "done";

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
 * Extract request ID from markdown content
 */
function extractRequestId(content: string): string | null {
  const idMatch = content.match(/\*\*ID\*\*:\s*(\S+)/);
  return idMatch?.[1] || null;
}

/**
 * Find all request IDs that have a specific tag
 */
async function findRequestIdsByTag(
  projectRoot: string,
  tag: string
): Promise<string[]> {
  const types: RequestType[] = ["change-request", "fix-request"];
  const statuses: RequestStatus[] = ["backlog", "todo", "doing", "done"];
  const requestIds: string[] = [];

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

          if (tags.includes(tag.toLowerCase())) {
            const requestId = extractRequestId(content);
            if (requestId) {
              requestIds.push(requestId);
            }
          }
        }
      } catch {
        // Directory doesn't exist, continue
      }
    }
  }

  return requestIds;
}

/**
 * Groups router with group management operations
 */
export const groupsRouter = router({
  /**
   * List all groups with their member requests
   */
  list: publicProcedure.query(async ({ ctx }) => {
    const data = await readGroups(ctx.projectRoot);
    // Sort by rank
    return data.groups.sort((a, b) => a.rank - b.rank);
  }),

  /**
   * Get a single group by ID
   */
  get: publicProcedure
    .input(z.object({ groupId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const data = await readGroups(ctx.projectRoot);
      const group = data.groups.find((g) => g.id === input.groupId);
      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Group not found: ${input.groupId}`,
        });
      }
      return group;
    }),

  /**
   * Create a new group
   */
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Group name is required").max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data = await readGroups(ctx.projectRoot);

      // Calculate rank (add to end)
      const maxRank = data.groups.reduce(
        (max, g) => Math.max(max, g.rank),
        0
      );

      const now = new Date().toISOString();
      const newGroup: Group = {
        id: generateGroupId(),
        name: input.name.trim(),
        requestIds: [],
        rank: maxRank + 1,
        createdAt: now,
        updatedAt: now,
      };

      data.groups.push(newGroup);
      await writeGroups(ctx.projectRoot, data);

      return newGroup;
    }),

  /**
   * Delete a group (does not delete the requests, just removes grouping)
   */
  delete: publicProcedure
    .input(z.object({ groupId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const data = await readGroups(ctx.projectRoot);
      const index = data.groups.findIndex((g) => g.id === input.groupId);

      if (index === -1) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Group not found: ${input.groupId}`,
        });
      }

      data.groups.splice(index, 1);
      await writeGroups(ctx.projectRoot, data);

      return { success: true };
    }),

  /**
   * Rename a group
   */
  rename: publicProcedure
    .input(
      z.object({
        groupId: z.string().min(1),
        name: z.string().min(1, "Group name is required").max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data = await readGroups(ctx.projectRoot);
      const group = data.groups.find((g) => g.id === input.groupId);

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Group not found: ${input.groupId}`,
        });
      }

      group.name = input.name.trim();
      group.updatedAt = new Date().toISOString();
      await writeGroups(ctx.projectRoot, data);

      return group;
    }),

  /**
   * Add a request to a group
   * If the request is already in another group, it will be moved
   */
  addRequest: publicProcedure
    .input(
      z.object({
        groupId: z.string().min(1),
        requestId: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data = await readGroups(ctx.projectRoot);
      const targetGroup = data.groups.find((g) => g.id === input.groupId);

      if (!targetGroup) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Group not found: ${input.groupId}`,
        });
      }

      // Remove from any existing group first (request can only be in one group)
      const existingGroup = findGroupForRequest(data.groups, input.requestId);
      if (existingGroup && existingGroup.id !== targetGroup.id) {
        existingGroup.requestIds = existingGroup.requestIds.filter(
          (id) => id !== input.requestId
        );
        existingGroup.updatedAt = new Date().toISOString();
      }

      // Add to target group if not already there
      if (!targetGroup.requestIds.includes(input.requestId)) {
        targetGroup.requestIds.push(input.requestId);
        targetGroup.updatedAt = new Date().toISOString();
      }

      await writeGroups(ctx.projectRoot, data);

      return targetGroup;
    }),

  /**
   * Remove a request from its group
   */
  removeRequest: publicProcedure
    .input(
      z.object({
        groupId: z.string().min(1),
        requestId: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data = await readGroups(ctx.projectRoot);
      const group = data.groups.find((g) => g.id === input.groupId);

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Group not found: ${input.groupId}`,
        });
      }

      if (!group.requestIds.includes(input.requestId)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Request ${input.requestId} is not in group ${input.groupId}`,
        });
      }

      group.requestIds = group.requestIds.filter((id) => id !== input.requestId);
      group.updatedAt = new Date().toISOString();
      await writeGroups(ctx.projectRoot, data);

      return group;
    }),

  /**
   * Move a group up or down in the list (changes rank)
   * delta: -1 to move up, +1 to move down
   */
  move: publicProcedure
    .input(
      z.object({
        groupId: z.string().min(1),
        delta: z.number().int().refine((d) => d === -1 || d === 1, {
          message: "Delta must be -1 (up) or +1 (down)",
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data = await readGroups(ctx.projectRoot);

      // Sort groups by rank
      const sortedGroups = [...data.groups].sort((a, b) => a.rank - b.rank);
      const currentIndex = sortedGroups.findIndex((g) => g.id === input.groupId);

      if (currentIndex === -1) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Group not found: ${input.groupId}`,
        });
      }

      const targetIndex = currentIndex + input.delta;

      // Check bounds
      if (targetIndex < 0 || targetIndex >= sortedGroups.length) {
        return sortedGroups; // No change needed
      }

      // Swap ranks with adjacent group
      const currentGroup = sortedGroups[currentIndex];
      const adjacentGroup = sortedGroups[targetIndex];

      const tempRank = currentGroup.rank;
      currentGroup.rank = adjacentGroup.rank;
      adjacentGroup.rank = tempRank;

      currentGroup.updatedAt = new Date().toISOString();
      adjacentGroup.updatedAt = new Date().toISOString();

      await writeGroups(ctx.projectRoot, data);

      // Return sorted groups
      return data.groups.sort((a, b) => a.rank - b.rank);
    }),

  /**
   * Get the group that a request belongs to (if any)
   */
  getGroupForRequest: publicProcedure
    .input(z.object({ requestId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const data = await readGroups(ctx.projectRoot);
      const group = findGroupForRequest(data.groups, input.requestId);
      return group || null;
    }),

  /**
   * Preview what would happen if we create a group from a tag.
   * Returns the tag, request IDs with that tag, and any collisions
   * (requests already in other groups).
   */
  previewFromTag: publicProcedure
    .input(z.object({ tag: z.string().min(1).transform((t) => t.trim().toLowerCase()) }))
    .query(async ({ ctx, input }) => {
      const requestIds = await findRequestIdsByTag(ctx.projectRoot, input.tag);
      const data = await readGroups(ctx.projectRoot);

      const collisions: { requestId: string; currentGroupId: string; currentGroupName: string }[] = [];

      for (const requestId of requestIds) {
        const existingGroup = findGroupForRequest(data.groups, requestId);
        if (existingGroup) {
          collisions.push({
            requestId,
            currentGroupId: existingGroup.id,
            currentGroupName: existingGroup.name,
          });
        }
      }

      return {
        tag: input.tag,
        requestIds,
        collisions,
      };
    }),

  /**
   * Create a group from a tag with collision handling strategy.
   * - 'move-all': All tagged requests join new group (removes from old groups)
   * - 'keep-existing': Only requests NOT in a group join new group
   * - 'manual': Use manualSelections array to decide per-request
   */
  createFromTag: publicProcedure
    .input(
      z.object({
        tag: z.string().min(1).transform((t) => t.trim().toLowerCase()),
        collisionStrategy: z.enum(["move-all", "keep-existing", "manual"]),
        manualSelections: z
          .array(
            z.object({
              requestId: z.string().min(1),
              moveToNew: z.boolean(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const requestIds = await findRequestIdsByTag(ctx.projectRoot, input.tag);
      const data = await readGroups(ctx.projectRoot);

      // Determine which requests to add to the new group
      const requestsToAdd: string[] = [];

      for (const requestId of requestIds) {
        const existingGroup = findGroupForRequest(data.groups, requestId);

        if (!existingGroup) {
          // Not in any group, always add
          requestsToAdd.push(requestId);
        } else {
          // In a group, check collision strategy
          switch (input.collisionStrategy) {
            case "move-all":
              requestsToAdd.push(requestId);
              break;
            case "keep-existing":
              // Skip - keep in existing group
              break;
            case "manual": {
              const selection = input.manualSelections?.find((s) => s.requestId === requestId);
              if (selection?.moveToNew) {
                requestsToAdd.push(requestId);
              }
              break;
            }
          }
        }
      }

      // Generate unique group name (tag name, with suffix if needed)
      const baseName = input.tag;
      let groupName = baseName;
      let suffix = 2;
      while (data.groups.some((g) => g.name.toLowerCase() === groupName.toLowerCase())) {
        groupName = `${baseName}-${suffix}`;
        suffix++;
      }

      // Calculate rank (add to end)
      const maxRank = data.groups.reduce((max, g) => Math.max(max, g.rank), 0);

      const now = new Date().toISOString();
      const newGroup: Group = {
        id: generateGroupId(),
        name: groupName,
        requestIds: [],
        rank: maxRank + 1,
        createdAt: now,
        updatedAt: now,
      };

      // Remove requests from old groups and add to new group
      for (const requestId of requestsToAdd) {
        const existingGroup = findGroupForRequest(data.groups, requestId);
        if (existingGroup) {
          existingGroup.requestIds = existingGroup.requestIds.filter((id) => id !== requestId);
          existingGroup.updatedAt = now;
        }
        newGroup.requestIds.push(requestId);
      }

      data.groups.push(newGroup);
      await writeGroups(ctx.projectRoot, data);

      return {
        group: newGroup,
        addedCount: requestsToAdd.length,
        skippedCount: requestIds.length - requestsToAdd.length,
      };
    }),
});
