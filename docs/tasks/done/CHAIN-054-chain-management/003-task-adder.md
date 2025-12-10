# Task: TaskAdder component

**Chain**: CHAIN-054-chain-management  
**Task**: 003-task-adder  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Create a quick-add form for adding tasks to an existing chain.

---

## Expected Files

- `packages/web/src/components/chains/task-adder.tsx`

---

## Acceptance Criteria

- [x] Compact form with fields: slug, title, description
- [x] Optional fields: expectedFiles, acceptance criteria, constraints
- [x] Calls chains.addTask mutation on submit
- [x] Clears form and shows success toast on completion
- [x] Invalidates task list query to show new task

---

## Notes

**Completed**: 2025-12-10

### Files Created/Modified

- `packages/web/src/components/chains/task-adder.tsx` (new) - Main component
- `packages/web/src/components/ui/sonner.tsx` (new) - Toast component
- `packages/web/src/app/layout.tsx` (modified) - Added Toaster
- `packages/web/src/components/chains/index.ts` (modified) - Export TaskAdder
- `packages/web/package.json` (modified) - Added sonner dependency

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
