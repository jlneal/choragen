// ADR: ADR-011-web-api-architecture

/**
 * tRPC Context
 *
 * Creates the context available to all tRPC procedures.
 * The context provides access to @choragen/core managers via projectRoot.
 */

/**
 * Context interface for tRPC procedures.
 * All procedures have access to these values.
 */
export interface Context {
  /** Root directory for @choragen/core managers */
  projectRoot: string;
}

/**
 * Creates context for each tRPC request.
 * Called by the API route handler for each incoming request.
 */
export function createContext(): Context {
  return {
    projectRoot: process.env.CHORAGEN_PROJECT_ROOT || process.cwd(),
  };
}

export type { Context as TRPCContext };
