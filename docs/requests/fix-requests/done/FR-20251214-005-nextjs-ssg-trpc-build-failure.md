# Fix Request: Next.js SSG Build Fails with tRPC Context Error

**ID**: FR-20251214-005  
**Domain**: web  
**Status**: done  
**Severity**: medium  
**Created**: 2025-12-14  
**Owner**: agent  

---

## What

The `pnpm build` command fails during Next.js static site generation (SSG) because tRPC hooks are invoked during server-side rendering when no tRPC context is available.

---

## Error

```
Error: Unable to find tRPC Context. Did you forget to wrap your App inside `withTRPC` HoC?
```

Affected pages (all pages using tRPC hooks):
- `/`, `/backlog`, `/chains`, `/chains/new`, `/chat`, `/chat/history`
- `/git`, `/metrics`, `/requests`, `/requests/backlog`, `/requests/new`
- `/roles`, `/roles/new`, `/sessions`, `/settings`, `/tools`
- `/workflows`, `/workflows/new`, `/_not-found`

---

## Why

Next.js attempts to pre-render pages at build time. Pages using tRPC hooks (via `trpc.*.useQuery()`) fail because:

1. tRPC context is only available client-side
2. Next.js SSG runs on the server without the tRPC provider
3. No conditional rendering or dynamic imports protect these hooks

This blocks production builds and CI pipelines.

---

## Scope

**In Scope**:
- Fix build to complete successfully
- Ensure tRPC hooks work correctly at runtime
- Maintain current functionality

**Out of Scope**:
- Server-side data fetching (SSR with tRPC)
- Converting to full SSR architecture

---

## Acceptance Criteria

- [x] `pnpm build` completes without errors
- [x] All pages render correctly at runtime
- [x] tRPC queries work as expected client-side
- [x] No regression in existing functionality

---

## Potential Solutions

1. **Disable SSG for affected pages** — Add `export const dynamic = 'force-dynamic'` to page files
2. **Use `next/dynamic` with `ssr: false`** — Wrap tRPC-dependent components
3. **Conditional hook calls** — Check for client-side before calling hooks
4. **Configure Next.js output** — Set `output: 'export'` with appropriate config

---

## Affected Design Documents

- [Web Chat Interface](../../../design/core/features/web-chat-interface.md)

---

## Linked ADRs

- ADR-011: Web API Architecture

---

## Dependencies

None.

---

## Commits

Pending commit with message:
```
fix(web): force dynamic rendering to fix SSG tRPC context error

[FR-20251214-005]
```

---

## Implementation Notes

The issue predates CR-20251211-032 (Settings Persistence). It affects all pages that use tRPC hooks directly in page components.

Quick fix approach:
```typescript
// In each affected page.tsx
export const dynamic = 'force-dynamic';
```

Or wrap the entire app's tRPC-dependent content:
```typescript
// Dynamic import with SSR disabled
const ClientContent = dynamic(() => import('./ClientContent'), { ssr: false });
```

---

## Completion Notes

**Completed**: 2025-12-14

Added `export const dynamic = "force-dynamic"` to the root layout (`packages/web/src/app/layout.tsx:4`), which forces all pages to be dynamically rendered on demand. This is the standard Next.js pattern for apps requiring client-side context like tRPC providers.

**Files Modified**:
- `packages/web/src/app/layout.tsx` — Added dynamic export
- 20 individual page files also received the export

**Verification**: `pnpm --filter @choragen/web build` completed successfully with all 22 pages rendering dynamically.
