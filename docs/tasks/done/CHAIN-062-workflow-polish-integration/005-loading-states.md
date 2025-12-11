# Task: Add loading skeleton and typing indicator components

**Chain**: CHAIN-062-workflow-polish-integration  
**Task**: 005-loading-states  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Add loading skeleton components and typing indicator for better UX during data fetching and agent processing.

---

## Expected Files

- `packages/web/src/components/chat/typing-indicator.tsx — Typing animation`
- `packages/web/src/components/chat/message-skeleton.tsx — Message loading skeleton`
- `packages/web/src/components/chat/workflow-card-skeleton.tsx — Card loading skeleton`
- `packages/web/src/__tests__/components/chat/loading-states.test.tsx — Tests`

---

## Acceptance Criteria

- [ ] TypingIndicator shows animated dots when agent is processing
- [ ] MessageSkeleton shows placeholder while messages load
- [ ] WorkflowCardSkeleton shows placeholder in history list
- [ ] Skeletons match actual component dimensions
- [ ] Typing indicator appears after agent receives message, disappears on response
- [ ] Consider using Framer Motion for smooth animations

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
