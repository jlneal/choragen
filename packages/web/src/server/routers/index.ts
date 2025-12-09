// ADR: ADR-011-web-api-architecture

/**
 * Root tRPC Router
 *
 * Combines all sub-routers into the main appRouter.
 * This is the entry point for all tRPC procedures.
 */
import { router, publicProcedure } from "../trpc";
import { chainsRouter } from "./chains";
import { tasksRouter } from "./tasks";
import { requestsRouter } from "./requests";
import { sessionsRouter } from "./sessions";
import { metricsRouter } from "./metrics";
import { configRouter } from "./config";

/**
 * Root application router.
 * Combines all sub-routers into a single entry point.
 */
export const appRouter = router({
  /**
   * Health check procedure.
   * Useful for verifying the API is running.
   */
  health: publicProcedure.query(() => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }),

  /**
   * Chain management router.
   * Full CRUD operations for task chains.
   */
  chains: chainsRouter,

  /**
   * Task management router.
   * Full CRUD operations and status transitions for tasks.
   */
  tasks: tasksRouter,

  /**
   * Request management router.
   * File-based operations for Change Requests (CR) and Fix Requests (FR).
   */
  requests: requestsRouter,

  /**
   * Sessions router.
   * Agent session state derived from active locks.
   */
  sessions: sessionsRouter,

  /**
   * Metrics router.
   * Pipeline metrics from MetricsCollector.
   */
  metrics: metricsRouter,

  /**
   * Config router.
   * Project and governance configuration from YAML files.
   */
  config: configRouter,
});

/**
 * Type definition for the root router.
 * Export this for use in the tRPC client.
 */
export type AppRouter = typeof appRouter;
