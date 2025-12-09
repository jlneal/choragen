# Task: Set up tRPC context, router, and public procedure

**Chain**: CHAIN-042-web-api-server  
**Task**: 002-trpc-setup  
**Status**: in-review  
**Type**: impl  
**Created**: 2025-12-09

---

## Objective

Set up the tRPC v11 foundation including context creation, router factory, public procedure, and Next.js API route handler. This establishes the type-safe API infrastructure for all subsequent routers.

---

## Expected Files

- `packages/web/src/`
- `├── server/`
- `│   ├── trpc.ts              # tRPC initialization (context, router, procedure)`
- `│   └── context.ts           # Context factory with projectRoot`
- `└── app/`
- `└── api/`
- `└── trpc/`
- `└── [trpc]/`
- `└── route.ts  # Next.js API route handler`

---

## Acceptance Criteria

- [ ] src/server/context.ts creates context with projectRoot from env or cwd
- [ ] src/server/trpc.ts exports:
- [ ] - router - tRPC router factory
- [ ] - publicProcedure - base procedure with context
- [ ] - createCallerFactory - for server-side calls
- [ ] src/app/api/trpc/[trpc]/route.ts handles GET/POST with fetchRequestHandler
- [ ] Context includes projectRoot: string for @choragen/core managers
- [ ] Error handling configured with proper tRPC error formatting
- [ ] TypeScript compiles without errors

---

## Notes

**tRPC v11 Pattern**:
```typescript
// src/server/trpc.ts
import { initTRPC } from '@trpc/server';
import { Context } from './context';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
```

**Context Pattern**:
```typescript
// src/server/context.ts
export interface Context {
  projectRoot: string;
}

export function createContext(): Context {
  return {
    projectRoot: process.env.CHORAGEN_PROJECT_ROOT || process.cwd(),
  };
}
```

**Reference CR**: `docs/requests/change-requests/doing/CR-20251208-002-web-api-server.md`

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
