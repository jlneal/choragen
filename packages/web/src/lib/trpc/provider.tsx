// ADR: ADR-011-web-api-architecture

"use client";

/**
 * tRPC Provider Component
 *
 * Wraps the application with tRPC and React Query providers.
 * This enables tRPC hooks to work in client components.
 */
import { useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, splitLink } from "@trpc/client";
import {
  createWSClient,
  wsLink,
  type TRPCWebSocketClient,
} from "@trpc/client/links/wsLink/wsLink";
import { useProject } from "@/hooks";
import { trpc } from "./client";

const PROJECT_HEADER = "x-choragen-project-root";

/**
 * Get the base URL for tRPC requests.
 * In browser, use relative URL. On server, construct absolute URL.
 */
function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    // Browser: use relative URL
    return "";
  }
  // Server-side rendering: use localhost
  // In production, this should be configured via environment variable
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * TRPCProvider component.
 *
 * Provides tRPC and React Query context to the application.
 * Must wrap any components that use tRPC hooks.
 *
 * @example
 * ```tsx
 * // In app/layout.tsx
 * import { TRPCProvider } from '@/lib/trpc/provider';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <TRPCProvider>{children}</TRPCProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const { projectPath } = useProject();
  const [wsClient, setWsClient] = useState<TRPCWebSocketClient | null>(null);

  // Create QueryClient once per component instance
  // Using useState ensures it's not recreated on re-renders
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Don't refetch on window focus by default
            refetchOnWindowFocus: false,
            // Keep data fresh for 1 minute
            staleTime: 60 * 1000,
          },
        },
      })
  );

  // Clear cached data when switching projects to prevent cross-project results.
  useEffect(() => {
    queryClient.clear();
  }, [projectPath, queryClient]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const client = createWSClient({
      url: getWebSocketUrl(projectPath),
      retryDelayMs: (attemptIndex: number) =>
        Math.min(1000 * 2 ** attemptIndex, 30_000),
    });

    setWsClient(client);

    return () => {
      client.close();
      setWsClient(null);
    };
  }, [projectPath]);

  const headers = useMemo(
    () => () =>
      projectPath
        ? {
            [PROJECT_HEADER]: projectPath,
          }
        : {},
    [projectPath]
  );

  const trpcClient = useMemo(() => {
    const url = `${getBaseUrl()}/api/trpc`;
    const subscriptionLink =
      wsClient !== null
        ? wsLink({ client: wsClient })
        : httpBatchLink({ url, headers });

    return trpc.createClient({
      links: [
        splitLink({
          condition: (op) => op.type === "subscription",
          true: subscriptionLink,
          false: httpBatchLink({
            url,
            headers,
          }),
        }),
      ],
    });
  }, [headers, wsClient]);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

function getWebSocketUrl(projectRoot?: string | null): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = new URL(base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/api/trpc";

  if (projectRoot) {
    url.searchParams.set("projectRoot", projectRoot);
  } else {
    url.searchParams.delete("projectRoot");
  }

  return url.toString();
}
