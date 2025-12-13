# Task: Implement FeedbackManager Core

**Chain**: CHAIN-070-agent-feedback  
**Task**: 002-feedback-manager  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Implement the `FeedbackManager` class in `@choragen/core` that provides CRUD operations for feedback items. The manager handles creating, reading, updating, and deleting feedback, as well as lifecycle transitions (acknowledge, respond, dismiss).

---

## Expected Files

- `packages/core/src/feedback/FeedbackManager.ts` - Core manager class
- `packages/core/src/feedback/__tests__/FeedbackManager.test.ts` - Unit tests

---

## File Scope

- CREATE: `packages/core/src/feedback/FeedbackManager.ts`
- CREATE: `packages/core/src/feedback/__tests__/FeedbackManager.test.ts`
- MODIFY: `packages/core/src/feedback/index.ts` (add FeedbackManager export)

---

## Acceptance Criteria

- [ ] `FeedbackManager.create()` creates feedback with generated ID and timestamps
- [ ] `FeedbackManager.get()` retrieves feedback by ID
- [ ] `FeedbackManager.list()` returns feedback with optional filters (workflowId, status, type, priority)
- [ ] `FeedbackManager.acknowledge()` transitions pending → acknowledged
- [ ] `FeedbackManager.respond()` adds response and transitions to resolved
- [ ] `FeedbackManager.dismiss()` transitions to dismissed
- [ ] Default priority applied based on feedback type per design doc rules
- [ ] Unit tests cover all operations and edge cases

---

## Notes

**Completed 2025-12-13** — Impl agent delivered:
- `packages/core/src/feedback/FeedbackManager.ts` — Full CRUD + lifecycle with file-based persistence
- `packages/core/src/feedback/__tests__/FeedbackManager.test.ts` — 7 test cases
- `packages/core/src/feedback/index.ts` — Added FeedbackManager export

**Design note**: Persistence integrated directly into FeedbackManager rather than separate FeedbackStore class. Task 003 (FeedbackStore) can be marked complete or skipped.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
