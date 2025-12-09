// ADR: ADR-011-web-api-architecture

/**
 * Sessions tRPC Router
 *
 * Exposes agent session state derived from active locks.
 * Each lock entry represents an active session with an agent working on files.
 */
import { z } from "zod";
import { router, publicProcedure, TRPCError } from "../trpc";
import { LockManager, type FileLock } from "@choragen/core";

/**
 * Session info derived from a file lock
 */
interface Session {
  /** Chain ID this session is working on */
  chainId: string;
  /** Agent role (impl/control) */
  agent: string;
  /** When the session started */
  startedAt: Date;
  /** Files/patterns the session is working on */
  files: string[];
  /** When the session lock expires */
  expiresAt?: Date;
}

/**
 * Helper to create a LockManager instance from context
 */
function getLockManager(projectRoot: string): LockManager {
  return new LockManager(projectRoot);
}

/**
 * Convert a FileLock to a Session
 */
function lockToSession(chainId: string, lock: FileLock): Session {
  return {
    chainId,
    agent: lock.agent,
    startedAt: lock.acquired,
    files: lock.files,
    expiresAt: lock.expiresAt,
  };
}

/**
 * Sessions router for agent session state
 */
export const sessionsRouter = router({
  /**
   * List all active sessions (derived from locks)
   */
  list: publicProcedure.query(async ({ ctx }) => {
    const manager = getLockManager(ctx.projectRoot);
    const locks = await manager.getAllLocks();

    return Object.entries(locks).map(([chainId, lock]) =>
      lockToSession(chainId, lock)
    );
  }),

  /**
   * Get session details by chain ID
   */
  get: publicProcedure
    .input(z.string().min(1, "Chain ID is required"))
    .query(async ({ ctx, input }) => {
      const manager = getLockManager(ctx.projectRoot);
      const lock = await manager.getLock(input);

      if (!lock) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No active session for chain: ${input}`,
        });
      }

      return lockToSession(input, lock);
    }),

  /**
   * Get all active file locks
   */
  getActiveLocks: publicProcedure.query(async ({ ctx }) => {
    const manager = getLockManager(ctx.projectRoot);
    return manager.getAllLocks();
  }),

  /**
   * Get lock for a specific chain
   */
  getLockForChain: publicProcedure
    .input(z.string().min(1, "Chain ID is required"))
    .query(async ({ ctx, input }) => {
      const manager = getLockManager(ctx.projectRoot);
      const lock = await manager.getLock(input);

      if (!lock) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No lock found for chain: ${input}`,
        });
      }

      return {
        chainId: input,
        ...lock,
      };
    }),
});
