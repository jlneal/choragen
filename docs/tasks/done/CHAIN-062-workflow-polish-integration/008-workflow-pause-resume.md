# Task: Add workflow pause and resume functionality

**Chain**: CHAIN-062-workflow-polish-integration  
**Task**: 008-workflow-pause-resume  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Add workflow pause and resume functionality so users can temporarily stop a workflow and continue later.

---

## Expected Files

- `packages/web/src/components/chat/workflow-actions.tsx — Add pause/resume buttons`
- `packages/web/src/server/routers/workflow.ts — Add workflow.pause and workflow.resume mutations`
- `packages/web/src/__tests__/components/chat/workflow-pause-resume.test.tsx — Tests`

---

## Acceptance Criteria

- [ ] Pause button visible for active workflows
- [ ] Pausing stops workflow at current point
- [ ] Paused workflows show "paused" status badge
- [ ] Resume button visible for paused workflows
- [ ] Resuming continues from where it left off
- [ ] Paused workflows appear in history with paused filter

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
