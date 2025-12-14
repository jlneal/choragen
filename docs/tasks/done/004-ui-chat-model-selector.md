# Task: Add Model Selector to Chat UI

**Chain**: CR-20251214-001  
**Task**: 004  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Add a model selector dropdown to the chat interface allowing users to switch models during a conversation.

---

## Context

Users need to:
1. See which model is currently active
2. Switch to a different model mid-conversation
3. See which model generated each message (in message metadata)

The selector should show models grouped by provider.

---

## Expected Files

- `packages/web/src/components/chat/model-selector.tsx` — New component
- `packages/web/src/components/chat/chat-input.tsx` — Integrate selector
- `packages/web/src/server/routers/providers.ts` — tRPC router for fetching models
- `packages/web/src/components/chat/message.tsx` — Show model badge on messages

---

## Acceptance Criteria

- [x] Model selector dropdown in chat input area
- [x] Shows models grouped by provider (Anthropic, OpenAI)
- [x] Current model highlighted
- [x] Selecting model updates workflow state
- [x] Messages show which model generated them (subtle badge)
- [x] Graceful fallback when no providers configured
- [x] Responsive design (works on mobile)

---

## Constraints

- Use existing UI component library (shadcn/ui)
- Match existing chat UI styling
- Don't block sending messages if model fetch fails

---

## Notes

Depends on Task 002 for provider abstraction and Task 003 for manager updates.

Consider using a command palette style (⌘K) for power users in addition to dropdown.
