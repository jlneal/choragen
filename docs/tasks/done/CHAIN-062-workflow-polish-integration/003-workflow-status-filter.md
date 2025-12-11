# Task: Add workflow status filter to history view

**Chain**: CHAIN-062-workflow-polish-integration  
**Task**: 003-workflow-status-filter  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Add filtering capability to the workflow history view so users can filter by workflow status (all, active, paused, completed, cancelled).

---

## Expected Files

- `packages/web/src/components/chat/workflow-filter.tsx` — Filter component
- `packages/web/src/app/chat/history/page.tsx` — Integrate filter
- `packages/web/src/__tests__/components/chat/workflow-filter.test.tsx` — Tests

---

## Acceptance Criteria

- [ ] Filter dropdown or tabs for status selection
- [ ] "All" option shows all workflows
- [ ] Individual status filters work correctly
- [ ] Filter state persists in URL query params
- [ ] Count badge shows number of workflows per status

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
