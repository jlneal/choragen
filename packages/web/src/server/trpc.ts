// ADR: ADR-011-web-api-architecture

/**
 * tRPC Initialization
 *
 * Sets up the tRPC instance with context and exports the router factory,
 * public procedure, and caller factory for server-side calls.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";

/**
 * Initialize tRPC with our context type.
 * This is done once and reused for all routers.
 */
const t = initTRPC.context<Context>().create({
  /**
   * Error formatter for consistent error responses.
   * In development, includes stack traces for debugging.
   */
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Include stack trace in development only
        stack:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
    };
  },
});

/**
 * Router factory for creating tRPC routers.
 * Use this to define route namespaces (e.g., chains, tasks, governance).
 */
export const router = t.router;

/**
 * Public procedure - base procedure with context.
 * All procedures start from this and can add middleware/validation.
 */
export const publicProcedure = t.procedure;

/**
 * Caller factory for server-side calls.
 * Allows calling tRPC procedures directly from server components.
 *
 * @example
 * ```ts
 * const createCaller = createCallerFactory(appRouter);
 * const caller = createCaller(createContext());
 * const chains = await caller.chains.list();
 * ```
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * Middleware builder for creating reusable middleware.
 */
export const middleware = t.middleware;

/**
 * Re-export TRPCError for use in routers.
 */
export { TRPCError };
