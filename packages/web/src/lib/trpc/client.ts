// ADR: ADR-011-web-api-architecture

/**
 * tRPC React Client
 *
 * Creates the tRPC React hooks for use in client components.
 * Provides type-safe API calls with automatic caching via React Query.
 */
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/routers";

/**
 * tRPC React hooks instance.
 *
 * Use this to access tRPC procedures in client components:
 * - `trpc.chains.list.useQuery()` - Fetch chains
 * - `trpc.tasks.create.useMutation()` - Create a task
 * - `trpc.useUtils()` - Access query utilities for invalidation
 *
 * @example
 * ```tsx
 * 'use client';
 * import { trpc } from '@/lib/trpc/client';
 *
 * function ChainList() {
 *   const { data, isLoading } = trpc.chains.list.useQuery();
 *   if (isLoading) return <div>Loading...</div>;
 *   return <ul>{data?.map(chain => <li key={chain.id}>{chain.id}</li>)}</ul>;
 * }
 * ```
 */
export const trpc = createTRPCReact<AppRouter>();
