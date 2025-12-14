# Task: Create SuggestionManager in Core Package

**Chain**: CHAIN-078-fix-reflection  
**Task**: 003  
**Status**: superseded  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Implement `SuggestionManager` class in `@choragen/core` for CRUD operations on feedback suggestions, with persistence in `.choragen/suggestions/`.

---

## Context

CR-20251213-001 requires a manager for handling suggestion lifecycle. This follows the pattern of other managers in the core package (e.g., `TaskManager`, `ChainManager`).

---

## Expected Files

- `packages/core/src/suggestions/SuggestionManager.ts`
- `packages/core/src/suggestions/types.ts`
- `packages/core/src/suggestions/index.ts`
- `packages/core/src/index.ts` (export additions)
- `packages/core/__tests__/suggestions/SuggestionManager.test.ts`

---

## Acceptance Criteria

- [ ] `SuggestionManager` class created with CRUD methods (create, read, update, delete, list)
- [ ] Suggestion type definition includes: id, category, sourceRequestId, description, rationale, status, createdAt, promotedTo (optional CR ID)
- [ ] Suggestions persisted as YAML files in `.choragen/suggestions/`
- [ ] `list()` method supports filtering by category and status
- [ ] `promote()` method updates status and records target CR ID
- [ ] Unit tests cover all CRUD operations
- [ ] Exports added to package index

---

## Constraints

- Follow existing manager patterns in `@choragen/core`
- Use YAML for persistence (consistent with other `.choragen/` files)
- Include proper TypeScript types

---

## Notes

Reference existing managers for patterns:
- `packages/core/src/tasks/TaskManager.ts`
- `packages/core/src/chains/ChainManager.ts`

---

## Superseded Notes

Design review (2025-12-14) determined that `SuggestionManager` duplicates the existing `FeedbackManager` system. The `packages/core/src/suggestions/` directory was deleted. Reflection-generated improvements now use `FeedbackItem` with extended fields (`source`, `category`, `promotedTo`) handled by the existing `FeedbackManager`.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
