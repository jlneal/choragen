// ADR: ADR-011-web-api-architecture

/**
 * tRPC API Route Handler
 *
 * Next.js App Router API route that handles all tRPC requests.
 * Uses the fetch adapter for Edge-compatible request handling.
 */
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { DesignContract } from "@choragen/contracts";
import { appRouter } from "../../../../server/routers";
import { createContext } from "../../../../server/context";

/**
 * Handler function for tRPC requests.
 * Processes both GET and POST requests through tRPC.
 */
const trpcContract = (name: "GET" | "POST") =>
  DesignContract({
    designDoc: "../../docs/design/core/features/web-chat-interface.md",
    name,
    preconditions: ["Incoming request must target /api/trpc"],
    postconditions: ["Routes request through tRPC fetch adapter"],
    handler: (request: Request) =>
      fetchRequestHandler({
        endpoint: "/api/trpc",
        req: request,
        router: appRouter,
        createContext: ({ req }) => createContext({ req }),
        /**
         * Error handling for request processing.
         * Logs errors in development for debugging.
         */
        onError:
          process.env.NODE_ENV === "development"
            ? ({ path, error }) => {
                console.error(
                  `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
                );
              }
            : undefined,
      }),
  });

/**
 * Export handler for both GET and POST methods.
 * tRPC uses GET for queries and POST for mutations.
 */
export const GET = trpcContract("GET");
export const POST = trpcContract("POST");
