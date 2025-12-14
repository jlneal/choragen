# @choragen/web

Web dashboard for Choragen with Next.js 14 and tRPC API.

## Purpose

This package provides a web-based dashboard for monitoring and managing Choragen workflows:

- **Dashboard**: Visual overview of task chains, governance, and metrics
- **tRPC API**: Type-safe API layer connecting to @choragen/core
- **Real-time Updates**: Live status of chains and tasks

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **API**: tRPC v11
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts (to be added)
- **State**: TanStack Query (via tRPC)

## Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Dashboard home
│   ├── globals.css         # Tailwind + CSS variables
│   └── api/                # API routes (tRPC)
├── components/             # React components
│   └── ui/                 # shadcn/ui components
├── lib/                    # Utilities and configuration
│   └── trpc/               # tRPC client setup
└── server/                 # Server-side code
    └── routers/            # tRPC routers
```

## Development

```bash
# Start dev server
pnpm --filter @choragen/web dev

# Type check
pnpm --filter @choragen/web typecheck

# Build for production
pnpm --filter @choragen/web build
```

## Coding Conventions

- Use App Router conventions (server components by default)
- Client components must have `"use client"` directive
- tRPC procedures should be in `src/server/routers/`
- UI components go in `src/components/ui/`
- Follow shadcn/ui patterns for component structure

## Package Import Rules

**CRITICAL**: `@choragen/core` contains Node.js-specific APIs (`node:fs`, `node:path`, `node:crypto`) and **cannot be bundled for client-side rendering**.

### Allowed Imports by Component Type

| Component Type | `@choragen/core` | `@choragen/contracts` |
|----------------|------------------|----------------------|
| Server Components | ✅ Full imports | ✅ Full imports |
| Client Components (`"use client"`) | ⚠️ `import type` only | ✅ Full imports |
| tRPC Routers (`src/server/`) | ✅ Full imports | ✅ Full imports |

### Client Component Examples

```typescript
// ✅ CORRECT: Type-only import (stripped at compile time)
"use client";
import type { WorkflowMessage, FeedbackItem } from "@choragen/core";

// ✅ CORRECT: Use @choragen/contracts for runtime values
"use client";
import { HttpStatus } from "@choragen/contracts";

// ❌ WRONG: Runtime import in client component
"use client";
import { FeedbackManager } from "@choragen/core"; // Will cause webpack error!
```

### Why This Matters

Next.js bundles client components for browser execution. If a client component imports from `@choragen/core`, webpack tries to bundle Node.js APIs, causing:

```
TypeError: Cannot read properties of undefined (reading 'call')
```

The `next.config.mjs` uses `serverComponentsExternalPackages` to externalize `@choragen/core`, but this only works for server components. Client components must use `import type` only.

## API Design

tRPC routers should mirror @choragen/core exports:

```typescript
// src/server/routers/chains.ts
import { router, publicProcedure } from "../trpc";
import { ChainManager } from "@choragen/core";

export const chainsRouter = router({
  list: publicProcedure.query(async () => {
    // Return chain data
  }),
  get: publicProcedure.input(z.string()).query(async ({ input }) => {
    // Return single chain
  }),
});
```

## Related Packages

- `@choragen/core` - Core primitives (task chains, governance, locks)
- `@choragen/contracts` - Shared types and contracts

## Related ADRs

- **ADR-TBD**: Web dashboard architecture
- **ADR-TBD**: tRPC API design
