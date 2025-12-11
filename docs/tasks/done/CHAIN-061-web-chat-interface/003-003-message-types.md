# Task: Implement message type rendering: human, control, impl, system, error styles

**Chain**: CHAIN-061-web-chat-interface  
**Task**: 003-003-message-types  
**Status**: in-review  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Implement distinct visual styles for each message type in the chat interface. Each message type has specific styling and positioning requirements per the design doc.

---

## Expected Files

- `Update packages/web/src/components/chat/message-item.tsx — Add role-based styling`
- `packages/web/src/components/chat/message-styles.ts — Style constants/utilities (optional)`

---

## Acceptance Criteria

- [ ] Human messages: right-aligned, user bubble style (primary background)
- [ ] Control agent messages: left-aligned with "Control" role indicator badge
- [ ] Impl agent messages: left-aligned with "Impl" role indicator badge, slightly nested
- [ ] System messages: centered, muted text styling
- [ ] Error messages: red alert banner style with error icon
- [ ] Role badges use appropriate colors (control=blue, impl=purple, system=gray)
- [ ] Unit tests for each message type rendering

---

## Notes

Message roles from `@choragen/core`: `human`, `control`, `impl`, `system`.

Use `Badge` component for role indicators. Use Tailwind for positioning (flex, justify-end/start/center).

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
