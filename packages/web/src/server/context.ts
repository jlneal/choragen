// ADR: ADR-011-web-api-architecture

import type { IncomingMessage } from "http";
import * as path from "path";
import { URL } from "url";

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
const PROJECT_QUERY_PARAM = "projectRoot";

type RequestLike = Request | IncomingMessage;

function getDefaultProjectRoot(): string {
  return process.env.CHORAGEN_PROJECT_ROOT || process.cwd();
}

function normalizeProjectRoot(projectRoot?: string | null): string | undefined {
  if (!projectRoot) {
    return undefined;
  }

  const trimmed = projectRoot.trim();
  if (!trimmed) {
    return undefined;
  }

  return path.resolve(trimmed);
}

function toUrl(request?: RequestLike): URL | undefined {
  if (!request) {
    return undefined;
  }

  try {
    if (request instanceof Request) {
      return new URL(request.url);
    }

    const host = request.headers.host || "localhost:3000";
    const protocol = host.includes("localhost") || host.includes("127.0.0.1")
      ? "http"
      : "https";

    return new URL(request.url ?? "", `${protocol}://${host}`);
  } catch {
    return undefined;
  }
}

function getProjectRootFromHeader(request?: RequestLike): string | undefined {
  if (!request) {
    return undefined;
  }

  if (request instanceof Request) {
    return normalizeProjectRoot(request.headers.get(PROJECT_HEADER));
  }

  const headerValue = request.headers[PROJECT_HEADER];
  if (Array.isArray(headerValue)) {
    return normalizeProjectRoot(headerValue[0]);
  }

  return normalizeProjectRoot(headerValue);
}

function getProjectRootFromQuery(request?: RequestLike): string | undefined {
  const url = toUrl(request);
  if (!url) {
    return undefined;
  }

  return normalizeProjectRoot(url.searchParams.get(PROJECT_QUERY_PARAM));
}

/**
 * Creates context for each tRPC request.
 * Called by the API route handler for each incoming request.
 */
export function createContext({ req }: { req?: RequestLike } = {}): Context {
  const queryProjectRoot = getProjectRootFromQuery(req);
  const headerProjectRoot = getProjectRootFromHeader(req);

  return {
    projectRoot:
      queryProjectRoot || headerProjectRoot || getDefaultProjectRoot(),
  };
}

export type { Context as TRPCContext };
