# Task: Layout Integration

**Chain**: CHAIN-057-project-selector  
**Task**: TASK-057-004  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Integrate the project selector into the dashboard layout and wire up the ProjectProvider.

---

## Context

This task connects all the pieces:
1. Add `ProjectProvider` to the app layout
2. Add `ProjectSelector` to the header (between breadcrumbs and GitStatus)
3. Update tRPC client to send project header with requests
4. Ensure all data refetches when project changes

---

## Expected Files

- `packages/web/src/app/layout.tsx` - Add ProjectProvider
- `packages/web/src/components/layout/header.tsx` - Add ProjectSelector
- `packages/web/src/lib/trpc/client.ts` - Add project header to requests

---

## Acceptance Criteria

- [x] `ProjectProvider` wraps the app (completed in TASK-057-001)
- [x] `ProjectSelector` appears in header between breadcrumbs and GitStatus
- [x] tRPC client sends `x-choragen-project-root` header (completed in TASK-057-001)
- [x] Changing project clears query cache (completed in TASK-057-001)
- [x] Mobile layout shows project selector in header (responsive)
- [x] Default project from `NEXT_PUBLIC_CHORAGEN_PROJECT_ROOT` env (completed in TASK-057-001)

---

## Constraints

- Must maintain existing layout structure
- Mobile responsiveness must be preserved
- Follow existing patterns in layout components

---

## Notes

The tRPC client modification is critical - all queries must use the selected project. Consider using `queryClient.invalidateQueries()` when project changes to ensure fresh data.

Layout position per CR mockup:
```
┌─────────────────────────────────────────┐
│ 🏠 Choragen    [choragen ▼]    Settings │
└─────────────────────────────────────────┘
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
