# Task: Implement Feedback Persistence

**Chain**: CHAIN-070-agent-feedback  
**Task**: 003-feedback-persistence  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Implement file-based persistence for feedback items. Feedback is stored in the workflow directory at `.choragen/workflows/<workflow-id>/feedback/`. Each feedback item is a separate JSON file.

---

## Expected Files

- `packages/core/src/feedback/FeedbackStore.ts` - Persistence layer
- `packages/core/src/feedback/__tests__/FeedbackStore.test.ts` - Unit tests

---

## File Scope

- CREATE: `packages/core/src/feedback/FeedbackStore.ts`
- CREATE: `packages/core/src/feedback/__tests__/FeedbackStore.test.ts`
- MODIFY: `packages/core/src/feedback/FeedbackManager.ts` (inject store dependency)
- MODIFY: `packages/core/src/feedback/index.ts` (add FeedbackStore export)

---

## Acceptance Criteria

- [ ] `FeedbackStore.save()` writes feedback to `.choragen/workflows/<wfId>/feedback/<fbId>.json`
- [ ] `FeedbackStore.load()` reads feedback from file
- [ ] `FeedbackStore.loadAll()` reads all feedback for a workflow
- [ ] `FeedbackStore.delete()` removes feedback file
- [ ] Directory created automatically if missing
- [ ] Handles concurrent access gracefully
- [ ] Unit tests with temp directories

---

## Notes

**Completed 2025-12-13** — Superseded by task 002.

Persistence was integrated directly into `FeedbackManager` rather than as a separate `FeedbackStore` class. All acceptance criteria for this task are satisfied by the FeedbackManager implementation:
- File storage at `.choragen/workflows/<wfId>/feedback/<fbId>.json`
- Load/save/delete operations
- Directory auto-creation
- Unit tests with temp directories

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
