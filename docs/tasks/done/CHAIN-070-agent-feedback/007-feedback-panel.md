# Task: Create Feedback Panel Component

**Chain**: CHAIN-070-agent-feedback  
**Task**: 007-feedback-panel  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Create a dedicated feedback panel component that lists all feedback for a workflow with filtering and bulk management capabilities. This provides an alternative to inline chat responses.

---

## Expected Files

- `packages/web/src/components/feedback/FeedbackPanel.tsx` - Panel component
- `packages/web/src/components/feedback/FeedbackList.tsx` - List component
- `packages/web/src/components/feedback/FeedbackFilters.tsx` - Filter controls
- `packages/web/src/components/feedback/index.ts` - Barrel export

---

## File Scope

- CREATE: `packages/web/src/components/feedback/FeedbackPanel.tsx`
- CREATE: `packages/web/src/components/feedback/FeedbackList.tsx`
- CREATE: `packages/web/src/components/feedback/FeedbackFilters.tsx`
- CREATE: `packages/web/src/components/feedback/index.ts`

---

## Acceptance Criteria

- [ ] Panel lists all feedback for current workflow
- [ ] Filter by status (pending, acknowledged, resolved, dismissed)
- [ ] Filter by type (clarification, question, idea, blocker, review)
- [ ] Filter by priority (low, medium, high, critical)
- [ ] Sort by date, priority, or type
- [ ] Expand/collapse feedback details
- [ ] Respond and dismiss actions inline
- [ ] Empty state when no feedback matches filters

---

## Notes

**Completed 2025-12-13** — Impl agent delivered:
- `packages/web/src/components/feedback/FeedbackPanel.tsx` — Main panel with filtering, sorting, hydration helpers
- `packages/web/src/components/feedback/FeedbackList.tsx` — List with expand/collapse and inline FeedbackMessage
- `packages/web/src/components/feedback/FeedbackFilters.tsx` — Status/type/priority filters + sort dropdown
- `packages/web/src/components/feedback/index.ts` — Barrel exports
- `packages/web/src/components/feedback/FeedbackPanel.test.tsx` — Unit tests for sorting helpers and panel rendering

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
