# Task: Create Feedback Chat UI Component

**Chain**: CHAIN-070-agent-feedback  
**Task**: 006-feedback-chat-ui  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Create a React component that renders feedback items as interactive messages in the workflow chat. The component displays feedback type, content, context (files, code snippets, options), and provides response/dismiss actions.

---

## Expected Files

- `packages/web/src/components/chat/FeedbackMessage.tsx` - Main component
- `packages/web/src/components/chat/FeedbackMessage.test.tsx` - Component tests

---

## File Scope

- CREATE: `packages/web/src/components/chat/FeedbackMessage.tsx`
- CREATE: `packages/web/src/components/chat/FeedbackMessage.test.tsx`
- MODIFY: `packages/web/src/components/chat/index.ts` (export component)
- MODIFY: Chat message renderer to handle feedback message type

---

## Acceptance Criteria

- [ ] Component displays feedback type with appropriate icon/color
- [ ] Component shows feedback content and priority indicator
- [ ] Related files rendered as clickable links
- [ ] Code snippets rendered with syntax highlighting
- [ ] Options rendered as selectable radio buttons
- [ ] Respond button opens response input
- [ ] Dismiss button calls dismiss mutation
- [ ] Resolved feedback shows response content
- [ ] Component tests cover all states

---

## Notes

**Completed 2025-12-13** — Impl agent delivered:
- `packages/web/src/components/chat/FeedbackMessage.tsx` — 355-line component with type badges, priority indicator, files, snippets, options, respond/dismiss actions
- `packages/web/src/components/chat/FeedbackMessage.test.tsx` — 3 test cases covering pending, resolved, and form states
- `packages/web/src/components/chat/index.ts` — Added export
- `packages/web/src/components/chat/message-item.tsx` — Integrated feedback detection and rendering
- `packages/web/src/components/chat/message-styles.ts` — Added feedback message type

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
