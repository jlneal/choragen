# Task: Define Feedback Types and Schemas

**Chain**: CHAIN-070-agent-feedback  
**Task**: 001-feedback-types  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Define TypeScript types and Zod schemas for the Agent Feedback system in `@choragen/core`. This includes `FeedbackItem`, `FeedbackType`, `FeedbackStatus`, `FeedbackPriority`, `FeedbackContext`, and `FeedbackResponse` as specified in the design doc.

---

## Expected Files

- `packages/core/src/feedback/types.ts` - TypeScript interfaces and types
- `packages/core/src/feedback/schemas.ts` - Zod validation schemas
- `packages/core/src/feedback/index.ts` - Barrel export

---

## File Scope

- CREATE: `packages/core/src/feedback/types.ts`
- CREATE: `packages/core/src/feedback/schemas.ts`
- CREATE: `packages/core/src/feedback/index.ts`
- MODIFY: `packages/core/src/index.ts` (add feedback exports)

---

## Acceptance Criteria

- [ ] `FeedbackItem` interface matches design doc specification
- [ ] `FeedbackType` includes: clarification, question, idea, blocker, review
- [ ] `FeedbackStatus` includes: pending, acknowledged, resolved, dismissed
- [ ] `FeedbackPriority` includes: low, medium, high, critical
- [ ] `FeedbackContext` supports files, codeSnippets, options, metadata
- [ ] `FeedbackResponse` captures content, selectedOption, respondedBy, respondedAt
- [ ] Zod schemas validate all types with proper error messages
- [ ] Types exported from `@choragen/core`

---

## Notes

**Completed 2025-12-13** — Impl agent delivered:
- `packages/core/src/feedback/types.ts` — Domain constants and interfaces
- `packages/core/src/feedback/schemas.ts` — Zod schemas with custom error messages
- `packages/core/src/feedback/index.ts` — Barrel export
- `packages/core/src/index.ts` — Wired feedback exports

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
