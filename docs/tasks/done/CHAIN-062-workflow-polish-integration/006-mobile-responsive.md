# Task: Make chat layout mobile-responsive with breakpoints

**Chain**: CHAIN-062-workflow-polish-integration  
**Task**: 006-mobile-responsive  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Make the chat layout fully responsive for mobile devices with appropriate breakpoints and touch-friendly interactions.

---

## Expected Files

- `packages/web/src/components/chat/chat-container.tsx — Add responsive styles`
- `packages/web/src/components/chat/workflow-sidebar.tsx — Collapsible on mobile`
- `packages/web/src/components/chat/chat-input.tsx — Mobile-optimized input`
- `packages/web/src/__tests__/components/chat/responsive.test.tsx — Responsive tests`

---

## Acceptance Criteria

- [ ] Chat layout adapts to mobile viewport (<768px)
- [ ] Sidebar collapses to bottom sheet or hamburger menu on mobile
- [ ] Message bubbles use full width on mobile
- [ ] Input area is fixed at bottom on mobile
- [ ] Touch targets are at least 44px
- [ ] No horizontal scroll on mobile

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
