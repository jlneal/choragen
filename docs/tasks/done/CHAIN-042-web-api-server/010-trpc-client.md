# Task: Set up tRPC client for React integration

**Chain**: CHAIN-042-web-api-server  
**Task**: 010-trpc-client  
**Status**: in-review  
**Type**: impl  
**Created**: 2025-12-09

---

## Objective

Set up the tRPC client for React integration using `@trpc/react-query` and `@tanstack/react-query`. This enables type-safe API calls from React components with automatic caching and refetching.

---

## Expected Files

- `packages/web/src/`
- `├── lib/`
- `│   └── trpc/`
- `│       ├── client.ts          # tRPC React client hooks`
- `│       ├── server.ts          # Server-side caller for RSC`
- `│       └── provider.tsx       # TRPCProvider with QueryClient`
- `└── app/`
- `└── layout.tsx             # Updated to wrap with TRPCProvider`

---

## Acceptance Criteria

- [ ] src/lib/trpc/client.ts exports tRPC React hooks (trpc.useQuery, etc.)
- [ ] src/lib/trpc/server.ts exports server-side caller for React Server Components
- [ ] src/lib/trpc/provider.tsx creates TRPCProvider with QueryClientProvider
- [ ] Root layout wraps children with TRPCProvider
- [ ] TypeScript compiles without errors
- [ ] pnpm lint passes

---

## Notes

**tRPC React Client Pattern**:
```typescript
// src/lib/trpc/client.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/routers';

export const trpc = createTRPCReact<AppRouter>();
```

**Provider Pattern**:
```typescript
// src/lib/trpc/provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from './client';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: '/api/trpc' })],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

**Server-side Caller**:
```typescript
// src/lib/trpc/server.ts
import { createCallerFactory } from '@/server/trpc';
import { appRouter } from '@/server/routers';
import { createContext } from '@/server/context';

const createCaller = createCallerFactory(appRouter);
export const serverTrpc = createCaller(createContext());
```

**Reference CR**: `docs/requests/change-requests/doing/CR-20251208-002-web-api-server.md`

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
