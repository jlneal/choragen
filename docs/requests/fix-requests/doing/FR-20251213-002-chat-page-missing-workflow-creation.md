# Fix Request: Chat Page Missing Workflow Creation UI

**ID**: FR-20251213-002  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-13  
**Severity**: medium  
**Owner**: agent  

---

## Problem

The chat page only showed the `NewWorkflowView` component when there were no active workflows. When workflows existed, users saw a disabled "Create workflow (coming soon)" button with no way to start new workflows.

Additionally, a placeholder `ChatPreviewPanel` component with skeleton UI was displayed at the bottom of the page, which never loaded real content and confused users.

---

## Expected Behavior

Users should always be able to start new workflows from the chat page, regardless of whether active workflows exist. Placeholder UI should not be shown.

---

## Actual Behavior

- When active workflows existed, the `NewWorkflowView` was hidden and replaced with a `QuickStartCard` containing a disabled button
- A `ChatPreviewPanel` with skeleton placeholders was always shown at the bottom, never loading real content

---

## Steps to Reproduce

1. Navigate to `/chat` with at least one active workflow
2. Observe the disabled "Create workflow (coming soon)" button
3. Observe the "Chat workspace preview" section with skeleton UI that never loads

---

## Root Cause Analysis

The page conditionally rendered `NewWorkflowView` only when `showEmptyState` was true. The `ChatPreviewPanel` was a development placeholder that was never replaced with real functionality.

---

## Proposed Fix

1. Always render `NewWorkflowView` regardless of active workflow count
2. Remove the `QuickStartCard` and `ChatPreviewPanel` placeholder components
3. Simplify the empty state message to reference the form above

---

## Affected Files

- `packages/web/src/app/chat/page.tsx`

---

## Linked ADRs

- ADR-011-web-api-architecture

---

## Commits

No commits yet.

---

## Verification

- [ ] Bug no longer reproducible
- [ ] Regression test added
- [ ] Related functionality still works

---

## Completion Notes

[Added when moved to done/]
