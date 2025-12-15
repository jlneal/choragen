# Task: Fix Next.js SSG Build with tRPC Context Error

**Chain**: FR-20251214-005  
**Task**: T001  
**Type**: impl  
**Status**: done  
**Request**: FR-20251214-005

---

## Objective

Fix the Next.js build failure caused by tRPC hooks being called during SSG when no tRPC context is available.

---

## Context

The `pnpm build` command fails with:
```
Error: Unable to find tRPC Context. Did you forget to wrap your App inside `withTRPC` HoC?
```

**Root cause**: Pages with `"use client"` directive that call `trpc.*.useQuery()` fail during Next.js static generation because tRPC context is only available client-side.

**Affected files** (16+ files with tRPC hooks in page components):
- `src/app/settings/page.tsx`
- `src/app/tools/page.tsx`
- `src/app/workflows/page.tsx`
- `src/app/workflows/[name]/page.tsx`
- `src/app/chains/page.tsx`
- `src/app/chat/page.tsx`
- `src/app/chat/history/page.tsx`
- `src/app/roles/page.tsx`
- `src/app/roles/[id]/page.tsx`
- `src/app/workflows/new/page.tsx`
- And several client component files

---

## Approach

**Recommended solution**: Add `export const dynamic = 'force-dynamic'` to affected page files.

This is the simplest fix that:
1. Disables SSG for pages that require client-side tRPC context
2. Requires minimal code changes (one line per page)
3. Maintains all existing functionality
4. Is the standard Next.js pattern for dynamic pages

**Alternative approaches** (if needed):
- `next/dynamic` with `ssr: false` for component-level control
- Conditional rendering with `typeof window !== 'undefined'`

---

## Acceptance Criteria

- [ ] `pnpm --filter @choragen/web build` completes without errors
- [ ] All pages render correctly at runtime
- [ ] tRPC queries work as expected client-side
- [ ] No regression in existing functionality

---

## Implementation Steps

1. Identify all page files that use tRPC hooks (directly or via imported components)
2. Add `export const dynamic = 'force-dynamic'` to each affected page
3. Run `pnpm --filter @choragen/web build` to verify fix
4. Test pages at runtime to ensure functionality preserved

---

## Verification

```bash
# Build should complete without errors
pnpm --filter @choragen/web build

# Dev server should work normally
pnpm --filter @choragen/web dev
```
