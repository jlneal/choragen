# Task: Emit gate prompts as special message types in workflow

**Chain**: CHAIN-060-web-runtime-bridge  
**Task**: 004-gate-prompt-messages  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

When a workflow stage requires human approval (gate type `human_approval`), the system should automatically emit a special "gate_prompt" message to the workflow. This allows the chat UI to render approval buttons and prompt the user for action.



---

## Expected Files

- `packages/core/src/workflow/manager.ts` — Emit gate prompt when stage becomes awaiting_gate
- `packages/core/src/workflow/types.ts` — Add `gate_prompt` message type or metadata
- Tests for gate prompt emission


---

## Acceptance Criteria

- [x] When a stage with `human_approval` gate becomes active, a gate_prompt message is emitted
- [x] Gate prompt message includes the gate's prompt text
- [x] Gate prompt message includes stageIndex for UI to call satisfyGate
- [x] Message metadata identifies it as a gate prompt (`{ type: "gate_prompt", gateType, prompt }`)
- [x] Real-time subscription receives gate prompt messages
- [x] Tests verify gate prompt emission on stage activation (create + advance)
- [x] `pnpm --filter @choragen/core test` passes


---

## Notes

### Gate Prompt Message Format

```typescript
{
  role: "system",
  content: "Approval Required: Review the design document before proceeding.",
  stageIndex: 1,
  metadata: {
    type: "gate_prompt",
    gateType: "human_approval",
    prompt: "Review the design document before proceeding."
  }
}
```

### Trigger Points

Gate prompts should be emitted when:
1. A stage with `human_approval` gate becomes `active`
2. Or when the stage transitions to `awaiting_gate` status

The `WorkflowManager.advance()` method or stage activation logic is the natural place to emit these.

### Reference

- Gate types in `packages/core/src/workflow/types.ts`
- Stage transitions in `WorkflowManager.advance()`
- Design doc: `docs/design/core/features/web-chat-interface.md` (GatePrompt component)

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
