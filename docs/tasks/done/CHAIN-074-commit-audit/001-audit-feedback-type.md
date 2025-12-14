# Task: Add Audit Feedback Type

**Chain**: CHAIN-074-commit-audit  
**Task**: 001  
**Status**: todo  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Add the `audit` feedback type to the Agent Feedback system, enabling spot-check findings from commit reviews.

---

## Context

The Agent Feedback system currently supports these types: `clarification`, `question`, `idea`, `blocker`, `review`. We need to add `audit` as a new type with specific characteristics:

- **Not targeted** — No specific problem or feature; broad review
- **Spot-check nature** — Not comprehensive QA
- **System-generated** — Created by audit chain, not human-requested
- **Advisory** — Findings may spawn FRs but don't block workflow
- **Batched** — Multiple findings per commit, grouped together

Reference: `@/Users/justin/Projects/choragen/docs/design/core/features/agent-feedback.md:37-46`

---

## Expected Files

- `packages/core/src/feedback/types.ts`
- `packages/core/src/feedback/index.ts` (if exists, update exports)

---

## Acceptance Criteria

- [ ] `FeedbackType` union includes `"audit"`
- [ ] `audit` type has default priority of `"low"`
- [ ] `audit` type has `blocksWork: false`
- [ ] Type definitions include JSDoc explaining audit-specific behavior
- [ ] Exports are updated if needed

---

## Constraints

- Follow existing patterns in the feedback module
- Do not modify behavior of existing feedback types

---

## Notes

The audit feedback type will be used by the feedback compilation task (Task 9 in the audit chain) to create actual feedback items from aggregated findings.
