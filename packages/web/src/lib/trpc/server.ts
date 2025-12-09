// ADR: ADR-011-web-api-architecture

/**
 * tRPC Server-side Caller
 *
 * Creates a server-side caller for use in React Server Components.
 * Allows calling tRPC procedures directly without HTTP overhead.
 */
import "server-only";

import { createCallerFactory } from "@/server/trpc";
import { appRouter } from "@/server/routers";
import { createContext } from "@/server/context";

/**
 * Create a caller factory from the app router.
 * This is used to create callers with specific contexts.
 */
const createCaller = createCallerFactory(appRouter);

/**
 * Server-side tRPC caller for React Server Components.
 *
 * Use this to call tRPC procedures directly in server components
 * without going through HTTP. This is more efficient for RSC.
 *
 * @example
 * ```tsx
 * // In a Server Component
 * import { serverTrpc } from '@/lib/trpc/server';
 *
 * export default async function ChainsPage() {
 *   const chains = await serverTrpc.chains.list();
 *   return <ChainList chains={chains} />;
 * }
 * ```
 */
export const serverTrpc = createCaller(createContext());
