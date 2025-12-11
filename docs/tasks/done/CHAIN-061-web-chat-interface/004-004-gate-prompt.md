# Task: Create GatePrompt component with approve/reject buttons and satisfyGate integration

**Chain**: CHAIN-061-web-chat-interface  
**Task**: 004-004-gate-prompt  
**Status**: in-review  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Create the GatePrompt component that renders when a workflow stage requires human approval. This is a critical UX element for the human-driven development scenario.

---

## Expected Files

- `packages/web/src/components/chat/gate-prompt.tsx — Gate approval card component`
- `Update packages/web/src/components/chat/message-item.tsx — Render GatePrompt for gate_prompt messages`

---

## Acceptance Criteria

- [ ] GatePrompt renders as a Card with "Approval Required" header
- [ ] Shows gate prompt text from message metadata
- [ ] Approve button calls workflow.satisfyGate mutation with satisfiedBy: "user"
- [ ] Reject/Request Changes button available (may just add a message for now)
- [ ] Buttons disabled while mutation is pending
- [ ] Success/error feedback shown after action
- [ ] Gate prompt visually distinct from regular messages (border-primary)
- [ ] Unit tests for GatePrompt component

---

## Notes

Gate prompt messages have metadata: `{ type: "gate_prompt", gateType, prompt }`.

The `workflow.satisfyGate` mutation requires: `workflowId`, `stageIndex`, `satisfiedBy`.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
