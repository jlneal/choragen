// ADR: ADR-011-web-api-architecture

"use client";

/**
 * tRPC Provider Component
 *
 * Wraps the application with tRPC and React Query providers.
 * This enables tRPC hooks to work in client components.
 */
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "./client";

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

  // Create tRPC client once per component instance
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          // Optional: Add headers for authentication
          // headers() {
          //   return {
          //     authorization: getAuthToken(),
          //   };
          // },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
