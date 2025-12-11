# Task: Create collapsible ToolCallDisplay component for showing agent tool invocations

**Chain**: CHAIN-061-web-chat-interface  
**Task**: 006-006-tool-call-display  
**Status**: in-review  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Create a collapsible ToolCallDisplay component that shows agent tool invocations. Tool calls should be hidden by default to reduce noise but expandable for debugging/transparency.

---

## Expected Files

- `packages/web/src/components/chat/tool-call-display.tsx — Collapsible tool call component`
- `Update packages/web/src/components/chat/message-item.tsx — Render tool calls from message metadata`

---

## Acceptance Criteria

- [ ] ToolCallDisplay renders collapsed by default showing tool name only
- [ ] Expanding shows tool arguments and result (if available)
- [ ] Multiple tool calls in one message render as a list
- [ ] Tool name displayed with monospace font
- [ ] Arguments formatted as JSON with syntax highlighting (optional)
- [ ] Collapsible uses Chevron icon to indicate state
- [ ] Unit tests for ToolCallDisplay component

---

## Notes

Agent messages may have metadata: `{ toolCalls: [{ name, arguments, result }] }`.

This is for transparency—users can see what the agent is doing without being overwhelmed by details.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
