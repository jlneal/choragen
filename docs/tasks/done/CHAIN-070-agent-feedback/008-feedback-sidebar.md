# Task: Add Feedback Badge to Workflow Sidebar

**Chain**: CHAIN-070-agent-feedback  
**Task**: 008-feedback-sidebar  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Add a feedback badge to the workflow sidebar that shows the count of pending feedback items. Badge color indicates highest priority level among pending items.

---

## Expected Files

- `packages/web/src/components/sidebar/FeedbackBadge.tsx` - Badge component

---

## File Scope

- CREATE: `packages/web/src/components/sidebar/FeedbackBadge.tsx`
- MODIFY: Workflow sidebar component to include badge
- MODIFY: Sidebar to link to feedback panel or scroll to feedback in chat

---

## Acceptance Criteria

- [ ] Badge shows count of pending feedback
- [ ] Badge hidden when count is 0
- [ ] Badge color reflects highest priority (red=critical, orange=high, yellow=medium, gray=low)
- [ ] Clicking badge opens feedback panel or scrolls to first pending feedback
- [ ] Badge updates in real-time when feedback status changes

---

## Notes

**Completed 2025-12-13** — Impl agent delivered:
- `packages/web/src/components/sidebar/FeedbackBadge.tsx` — Badge with pending count, priority-based colors, safe test fallback, 5s polling
- `packages/web/src/components/chat/workflow-sidebar.tsx` — Integrated FeedbackBadge with scroll handler
- `packages/web/src/components/chat/feedback-scroll.ts` — Scroll utility for feedback section

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
