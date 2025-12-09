# Change Request: Web API Server

**ID**: CR-20251208-002  
**Domain**: web  
**Status**: done  
**Created**: 2025-12-08  
**Completed**: 2025-12-08  
**Owner**: control-agent  

---

## Summary

Create a tRPC-based API layer that exposes Choragen core functionality for the web dashboard. The API will be embedded in a Next.js application, providing type-safe endpoints for all dashboard operations.

---

## Motivation

The web dashboard needs programmatic access to:
- Chain and task data
- Request (CR/FR) information
- Agent session state
- Metrics and configuration

A tRPC API provides:
- End-to-end type safety (API to UI)
- Automatic TypeScript inference
- No code generation required
- Easy integration with React Query

---

## Scope

**In Scope**:
- tRPC router with procedures for core operations
- Read operations for chains, tasks, requests, sessions
- Write operations for CRUD on all entities
- Integration with `@choragen/core`
- Error handling and validation with Zod

**Out of Scope**:
- Authentication (Phase 3)
- Real-time subscriptions (Phase 3, separate CR)
- Multi-project support (Phase 3)

---

## Proposed Changes

### New Package

```
packages/
└── web/
    ├── src/
    │   ├── app/                    # Next.js app router
    │   ├── server/
    │   │   ├── routers/
    │   │   │   ├── chains.ts       # Chain CRUD
    │   │   │   ├── tasks.ts        # Task CRUD
    │   │   │   ├── requests.ts     # CR/FR CRUD
    │   │   │   ├── sessions.ts     # Agent sessions
    │   │   │   ├── metrics.ts      # Metrics queries
    │   │   │   └── config.ts       # Configuration
    │   │   ├── trpc.ts             # tRPC setup
    │   │   └── root.ts             # Root router
    │   └── lib/
    │       └── trpc-client.ts      # Client setup
    ├── package.json
    └── tsconfig.json
```

### Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 14 | App router, API routes, SSR |
| API | tRPC v11 | Type-safe, React Query integration |
| Validation | Zod | Schema validation, tRPC native |
| Core | @choragen/core | Reuse existing managers |

### API Structure

```typescript
// packages/web/src/server/root.ts
import { router } from './trpc';
import { chainsRouter } from './routers/chains';
import { tasksRouter } from './routers/tasks';
import { requestsRouter } from './routers/requests';
import { sessionsRouter } from './routers/sessions';
import { metricsRouter } from './routers/metrics';
import { configRouter } from './routers/config';

export const appRouter = router({
  chains: chainsRouter,
  tasks: tasksRouter,
  requests: requestsRouter,
  sessions: sessionsRouter,
  metrics: metricsRouter,
  config: configRouter,
});

export type AppRouter = typeof appRouter;
```

### Example Router

```typescript
// packages/web/src/server/routers/chains.ts
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { ChainManager } from '@choragen/core';

export const chainsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const manager = new ChainManager(ctx.projectRoot);
    return manager.getAllChains();
  }),
  
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const manager = new ChainManager(ctx.projectRoot);
      return manager.getChainSummary(input.id);
    }),
    
  create: publicProcedure
    .input(z.object({
      requestId: z.string(),
      slug: z.string(),
      title: z.string(),
      type: z.enum(['design', 'implementation']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const manager = new ChainManager(ctx.projectRoot);
      return manager.createChain(input);
    }),
});
```

### Context

```typescript
// packages/web/src/server/trpc.ts
import { initTRPC } from '@trpc/server';

interface Context {
  projectRoot: string;
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
```

---

## Acceptance Criteria

- [x] `@choragen/web` package created with Next.js 14
- [x] tRPC router with all core routers (chains, tasks, requests, sessions, metrics, config)
- [x] Read procedures for listing and getting entities
- [x] Write procedures for create/update/delete operations
- [x] Zod schemas for all inputs
- [x] Error handling with proper tRPC errors
- [x] Unit tests for router procedures
- [x] `pnpm build` passes
- [x] `pnpm lint` passes

---

## Dependencies

- None (foundation CR)

---

## Linked Design Documents

- [Web Dashboard](../../design/core/features/web-dashboard.md) (to be created)

---

## ADR Required

Yes - ADR for tRPC + Next.js architecture decision

---

## Completion Notes

Implemented complete tRPC API server via task chain CHAIN-042-web-api-server (12 tasks):

**Package**: `@choragen/web` with Next.js 14 + tRPC v11

**Routers implemented**:
- `chains` — 8 procedures (CRUD + task management)
- `tasks` — 11 procedures (CRUD + status transitions)
- `requests` — 6 procedures (CR/FR file-based operations)
- `sessions` — 4 procedures (lock-derived session state)
- `metrics` — 5 procedures (pipeline metrics)
- `config` — 3 procedures (YAML config access)

**Client integration**:
- React hooks via `@trpc/react-query`
- Server-side caller for RSC
- TRPCProvider with QueryClient

**Testing**: 42 unit tests passing

---

## Commits

[Populated by `choragen request:close`]
