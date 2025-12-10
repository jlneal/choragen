// ADR: ADR-011-web-api-architecture

import * as path from "path";

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

const PROJECT_HEADER = "x-choragen-project-root";

function getDefaultProjectRoot(): string {
  return process.env.CHORAGEN_PROJECT_ROOT || process.cwd();
}

function getProjectRootFromHeader(request?: Request): string | undefined {
  if (!request) {
    return undefined;
  }

  const headerValue = request.headers.get(PROJECT_HEADER)?.trim();
  if (!headerValue) {
    return undefined;
  }

  return path.resolve(headerValue);
}

/**
 * Creates context for each tRPC request.
 * Called by the API route handler for each incoming request.
 */
export function createContext({ req }: { req?: Request } = {}): Context {
  const headerProjectRoot = getProjectRootFromHeader(req);

  return {
    projectRoot: headerProjectRoot || getDefaultProjectRoot(),
  };
}

export type { Context as TRPCContext };
