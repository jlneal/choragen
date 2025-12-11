// ADR: ADR-011-web-api-architecture

/**
 * Backlog tRPC Router
 *
 * Provides backlog sequencing functionality with universal rank ordering.
 * Ranks are stored in .choragen/backlog-ranks.json file.
 * Every backlog request has a unique integer rank (1, 2, 3...) with no gaps.
 */
import { z } from "zod";
import { router, publicProcedure, TRPCError } from "../trpc";
import * as fs from "fs/promises";
import * as path from "path";

/**
 * Rank entry structure
 */
interface RankEntry {
  requestId: string;
  rank: number;
}

/**
 * Backlog ranks file structure
 */
interface BacklogRanksFile {
  ranks: RankEntry[];
}

/**
 * Get the backlog ranks file path
 */
function getRanksFilePath(projectRoot: string): string {
  return path.join(projectRoot, ".choragen", "backlog-ranks.json");
}

/**
 * Read ranks from file
 */
async function readRanks(projectRoot: string): Promise<BacklogRanksFile> {
  const filePath = getRanksFilePath(projectRoot);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as BacklogRanksFile;
  } catch {
    // Return empty ranks if file doesn't exist
    return { ranks: [] };
  }
}

/**
 * Write ranks to file
 */
async function writeRanks(
  projectRoot: string,
  data: BacklogRanksFile
): Promise<void> {
  const filePath = getRanksFilePath(projectRoot);
  // Ensure .choragen directory exists
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Normalize ranks to ensure they are contiguous (1, 2, 3...) with no gaps
 */
function normalizeRanks(ranks: RankEntry[]): RankEntry[] {
  // Sort by current rank
  const sorted = [...ranks].sort((a, b) => a.rank - b.rank);
  // Reassign ranks to be contiguous starting from 1
  return sorted.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

/**
 * Get the next available rank (for new entries)
 */
function getNextRank(ranks: RankEntry[]): number {
  if (ranks.length === 0) return 1;
  return Math.max(...ranks.map((r) => r.rank)) + 1;
}

/**
 * Backlog item with request metadata
 */
interface BacklogItem {
  id: string;
  type: "cr" | "fr";
  title: string;
  status: string;
  domain?: string;
  rank: number;
}

/**
 * Read request metadata from a file
 */
async function readRequestMetadata(
  projectRoot: string,
  requestId: string
): Promise<{ title: string; domain?: string; type: "cr" | "fr" } | null> {
  const requestTypes = ["change-requests", "fix-requests"] as const;
  const statuses = ["backlog", "todo", "doing", "done"] as const;

  for (const reqType of requestTypes) {
    for (const status of statuses) {
      const dirPath = path.join(projectRoot, "docs", "requests", reqType, status);
      try {
        const files = await fs.readdir(dirPath);
        for (const filename of files) {
          if (!filename.endsWith(".md")) continue;
          const filePath = path.join(dirPath, filename);
          const content = await fs.readFile(filePath, "utf-8");
          const idMatch = content.match(/\*\*ID\*\*:\s*(\S+)/);
          if (idMatch?.[1] === requestId) {
            const titleMatch = content.match(/^#\s+(?:Change Request|Fix Request):\s*(.+)$/m);
            const domainMatch = content.match(/\*\*Domain\*\*:\s*(\S+)/);
            return {
              title: titleMatch?.[1]?.trim() || filename.replace(".md", ""),
              domain: domainMatch?.[1],
              type: reqType === "change-requests" ? "cr" : "fr",
            };
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
 * Backlog router with ranking operations
 */
export const backlogRouter = router({
  /**
   * List all backlog items with metadata, sorted by rank
   */
  list: publicProcedure.query(async ({ ctx }) => {
    const data = await readRanks(ctx.projectRoot);
    const ranks = normalizeRanks(data.ranks);

    const items: BacklogItem[] = [];
    for (const entry of ranks) {
      const metadata = await readRequestMetadata(ctx.projectRoot, entry.requestId);
      items.push({
        id: entry.requestId,
        type: metadata?.type ?? "cr",
        title: metadata?.title ?? entry.requestId,
        status: "backlog",
        domain: metadata?.domain,
        rank: entry.rank,
      });
    }

    return items;
  }),

  /**
   * Get all ranks sorted by rank number
   */
  getRanks: publicProcedure.query(async ({ ctx }) => {
    const data = await readRanks(ctx.projectRoot);
    return normalizeRanks(data.ranks);
  }),

  /**
   * Reorder a single request to a new rank position
   * All other ranks shift to accommodate
   */
  reorder: publicProcedure
    .input(
      z.object({
        requestId: z.string().min(1, "Request ID is required"),
        newRank: z.number().int().positive("Rank must be a positive integer"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data = await readRanks(ctx.projectRoot);

      // Find existing entry
      const existingIndex = data.ranks.findIndex(
        (r) => r.requestId === input.requestId
      );

      if (existingIndex === -1) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Request not found in backlog ranks: ${input.requestId}`,
        });
      }

      const currentRank = data.ranks[existingIndex].rank;

      // If rank hasn't changed, no-op
      if (currentRank === input.newRank) {
        return normalizeRanks(data.ranks);
      }

      // Clamp newRank to valid range
      const maxRank = data.ranks.length;
      const targetRank = Math.min(Math.max(1, input.newRank), maxRank);

      // Remove the item from its current position
      const [movedItem] = data.ranks.splice(existingIndex, 1);

      // Normalize remaining ranks
      const normalized = normalizeRanks(data.ranks);

      // Insert at new position (targetRank - 1 because array is 0-indexed)
      const insertIndex = targetRank - 1;
      normalized.splice(insertIndex, 0, { ...movedItem, rank: targetRank });

      // Re-normalize to ensure contiguous ranks
      const finalRanks = normalizeRanks(normalized);

      data.ranks = finalRanks;
      await writeRanks(ctx.projectRoot, data);

      return finalRanks;
    }),

  /**
   * Move a group's members by a delta (positive = lower priority, negative = higher priority)
   * This redistributes the ranks of all group members while maintaining their relative order
   */
  moveGroup: publicProcedure
    .input(
      z.object({
        groupId: z.string().min(1, "Group ID is required"),
        delta: z.number().int().refine((d) => d !== 0, {
          message: "Delta must be non-zero",
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Read groups to get member request IDs
      const groupsFilePath = path.join(
        ctx.projectRoot,
        ".choragen",
        "groups.json"
      );
      let groupRequestIds: string[] = [];

      try {
        const groupsContent = await fs.readFile(groupsFilePath, "utf-8");
        const groupsData = JSON.parse(groupsContent) as {
          groups: Array<{ id: string; requestIds: string[] }>;
        };
        const group = groupsData.groups.find((g) => g.id === input.groupId);
        if (!group) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Group not found: ${input.groupId}`,
          });
        }
        groupRequestIds = group.requestIds;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Groups file not found or invalid`,
        });
      }

      if (groupRequestIds.length === 0) {
        return []; // No members to move
      }

      const data = await readRanks(ctx.projectRoot);

      // Separate group members from non-members
      const groupMembers = data.ranks.filter((r) =>
        groupRequestIds.includes(r.requestId)
      );
      const nonMembers = data.ranks.filter(
        (r) => !groupRequestIds.includes(r.requestId)
      );

      if (groupMembers.length === 0) {
        return normalizeRanks(data.ranks);
      }

      // Sort both by rank
      groupMembers.sort((a, b) => a.rank - b.rank);
      nonMembers.sort((a, b) => a.rank - b.rank);

      // Calculate the new position for the group block
      const minGroupRank = Math.min(...groupMembers.map((m) => m.rank));
      const maxGroupRank = Math.max(...groupMembers.map((m) => m.rank));

      // Calculate target position
      let targetStartRank: number;
      if (input.delta > 0) {
        // Moving down (lower priority = higher rank number)
        targetStartRank = Math.min(
          maxGroupRank + input.delta - groupMembers.length + 1,
          data.ranks.length - groupMembers.length + 1
        );
      } else {
        // Moving up (higher priority = lower rank number)
        targetStartRank = Math.max(minGroupRank + input.delta, 1);
      }

      // Rebuild the ranks array
      // Insert non-members, then insert group members at target position
      const result: RankEntry[] = [];
      let nonMemberIndex = 0;
      let groupMemberIndex = 0;

      for (let rank = 1; rank <= data.ranks.length; rank++) {
        if (
          rank >= targetStartRank &&
          rank < targetStartRank + groupMembers.length &&
          groupMemberIndex < groupMembers.length
        ) {
          // Insert group member
          result.push({
            requestId: groupMembers[groupMemberIndex].requestId,
            rank,
          });
          groupMemberIndex++;
        } else if (nonMemberIndex < nonMembers.length) {
          // Insert non-member
          result.push({
            requestId: nonMembers[nonMemberIndex].requestId,
            rank,
          });
          nonMemberIndex++;
        }
      }

      // Normalize and save
      const finalRanks = normalizeRanks(result);
      data.ranks = finalRanks;
      await writeRanks(ctx.projectRoot, data);

      return finalRanks;
    }),

  /**
   * Add a request to the backlog ranks (at the end by default)
   * Called when a request is added to backlog status
   */
  addRequest: publicProcedure
    .input(
      z.object({
        requestId: z.string().min(1, "Request ID is required"),
        rank: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data = await readRanks(ctx.projectRoot);

      // Check if already exists
      const existing = data.ranks.find((r) => r.requestId === input.requestId);
      if (existing) {
        return normalizeRanks(data.ranks);
      }

      // Add at specified rank or end
      const newRank = input.rank ?? getNextRank(data.ranks);
      data.ranks.push({ requestId: input.requestId, rank: newRank });

      // Normalize and save
      const finalRanks = normalizeRanks(data.ranks);
      data.ranks = finalRanks;
      await writeRanks(ctx.projectRoot, data);

      return finalRanks;
    }),

  /**
   * Remove a request from backlog ranks
   * Called when a request is promoted from backlog to todo
   */
  removeRequest: publicProcedure
    .input(
      z.object({
        requestId: z.string().min(1, "Request ID is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data = await readRanks(ctx.projectRoot);

      // Remove the request
      data.ranks = data.ranks.filter((r) => r.requestId !== input.requestId);

      // Normalize and save
      const finalRanks = normalizeRanks(data.ranks);
      data.ranks = finalRanks;
      await writeRanks(ctx.projectRoot, data);

      return finalRanks;
    }),

  /**
   * Sync ranks with actual backlog requests
   * Adds missing requests and removes stale entries
   */
  sync: publicProcedure
    .input(
      z.object({
        backlogRequestIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data = await readRanks(ctx.projectRoot);

      // Get current ranked IDs
      const rankedIds = new Set(data.ranks.map((r) => r.requestId));
      const actualIds = new Set(input.backlogRequestIds);

      // Remove stale entries (no longer in backlog)
      data.ranks = data.ranks.filter((r) => actualIds.has(r.requestId));

      // Add missing entries (new backlog requests)
      let nextRank = getNextRank(data.ranks);
      for (const requestId of input.backlogRequestIds) {
        if (!rankedIds.has(requestId)) {
          data.ranks.push({ requestId, rank: nextRank++ });
        }
      }

      // Normalize and save
      const finalRanks = normalizeRanks(data.ranks);
      data.ranks = finalRanks;
      await writeRanks(ctx.projectRoot, data);

      return finalRanks;
    }),
});
