# Task: Create core chat components: ChatContainer, MessageList, MessageItem, ChatInput

**Chain**: CHAIN-061-web-chat-interface  
**Task**: 002-002-chat-components  
**Status**: in-review  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Create the core chat components that form the foundation of the chat interface: ChatContainer (main wrapper), MessageList (scrollable message area), MessageItem (individual message), and ChatInput (text input with send).

---

## Expected Files

- `packages/web/src/components/chat/chat-container.tsx — Main chat wrapper component`
- `packages/web/src/components/chat/message-list.tsx — Scrollable message list with auto-scroll`
- `packages/web/src/components/chat/message-item.tsx — Individual message rendering`
- `packages/web/src/components/chat/chat-input.tsx — Input area with send button`
- `packages/web/src/components/chat/index.ts — Barrel export`

---

## Acceptance Criteria

- [ ] ChatContainer renders message list and input area in flex column layout
- [ ] MessageList uses ScrollArea and auto-scrolls to bottom on new messages
- [ ] MessageItem displays message content with timestamp
- [ ] ChatInput has text input and send button, calls workflow.sendMessage mutation
- [ ] Input clears after sending, disabled while sending
- [ ] Components are properly typed with TypeScript
- [ ] Unit tests for each component

---

## Notes

Use shadcn/ui components: `ScrollArea`, `Input`, `Button`.

Follow patterns from existing components like `packages/web/src/components/sessions/`.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
