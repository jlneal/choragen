# Task: Extend FeedbackItem with Source, Category, and PromotedTo Fields

**Chain**: CHAIN-078-fix-reflection  
**Task**: 003  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Extend `FeedbackItem` in `@choragen/core` with `source`, `category`, and `promotedTo` fields to support reflection-generated improvement suggestions.

---

## Context

Design review (2025-12-14) determined that reflection-generated suggestions should use the existing `FeedbackItem` system rather than a separate `SuggestionManager`. This task adds the necessary fields to distinguish reflection feedback from agent feedback.

---

## Expected Files

- `packages/core/src/feedback/types.ts` (modify)
- `packages/core/src/feedback/schemas.ts` (modify)
- `packages/core/src/feedback/FeedbackManager.ts` (modify for filtering)
- `packages/core/src/feedback/__tests__/FeedbackManager.test.ts` (add tests)

---

## Acceptance Criteria

- [ ] `FeedbackItem` extended with `source?: "agent" | "reflection" | "audit"`
- [ ] `FeedbackItem` extended with `category?: FeedbackCategory`
- [ ] `FeedbackItem` extended with `promotedTo?: string` (CR ID)
- [ ] `FeedbackCategory` type defined with values: lint, workflow, environment, documentation, testing, commit-hook, workflow-hook
- [ ] `FEEDBACK_CATEGORIES` constant exported
- [ ] Zod schemas updated for new fields
- [ ] `ListFeedbackFilters` extended with `source` and `category` filters
- [ ] `FeedbackManager.list()` supports filtering by source and category
- [ ] Unit tests cover new fields and filtering

---

## Constraints

- Maintain backward compatibility (new fields are optional)
- Follow existing patterns in feedback module
- Do not break existing FeedbackManager functionality

---

## Notes

New types to add:
```typescript
export type FeedbackCategory =
  | "lint"
  | "workflow"
  | "environment"
  | "documentation"
  | "testing"
  | "commit-hook"
  | "workflow-hook";

export const FEEDBACK_CATEGORIES: readonly FeedbackCategory[] = [
  "lint",
  "workflow",
  "environment",
  "documentation",
  "testing",
  "commit-hook",
  "workflow-hook",
] as const;

export type FeedbackSource = "agent" | "reflection" | "audit";

export const FEEDBACK_SOURCES: readonly FeedbackSource[] = [
  "agent",
  "reflection",
  "audit",
] as const;
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
