// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useMemo } from "react";
import { trpc } from "@/lib/trpc/client";

const PROVIDER_CACHE_MS = 5 * 60 * 1000;

export interface ProviderStatusResult {
  providers: Record<string, boolean>;
  isConfigured: boolean;
  isLoading: boolean;
  isError: boolean;
  error: unknown | null;
  refresh: () => void;
}

/**
 * Hook to check LLM provider configuration status.
 * Uses cached tRPC query data to avoid unnecessary network calls.
 */
export function useProviderStatus(): ProviderStatusResult {
  const query = trpc.settings.getProviders.useQuery(undefined, {
    staleTime: PROVIDER_CACHE_MS,
    refetchOnWindowFocus: true,
  });

  const providers = query.data ?? {
    anthropic: false,
    openai: false,
    google: false,
    ollama: false,
  };

  const isConfigured = useMemo(
    () => Object.values(providers).some(Boolean),
    [providers]
  );

  return {
    providers,
    isConfigured,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ?? null,
    refresh: () => query.refetch(),
  };
}
