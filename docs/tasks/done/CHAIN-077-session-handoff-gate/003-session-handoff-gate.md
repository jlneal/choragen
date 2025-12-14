# Task: Implement Session Handoff Gate

**ID**: 003  
**Chain**: CHAIN-077-session-handoff-gate  
**Type**: impl  
**Status**: todo  
**Created**: 2025-12-14  

---

## Description

Implement the main session handoff gate function that orchestrates validation and provides the public API. This is the entry point that control/impl agents call when handing off work.

---

## Acceptance Criteria

- [ ] `SessionHandoffGate` interface extends `StageGate` with handoff-specific fields
- [ ] `runSessionHandoffGate()` function implemented
- [ ] Gate accepts handoff context (from, to, task/chain reference)
- [ ] Gate runs configured validation checks
- [ ] Gate returns aggregate result with pass/fail and feedback
- [ ] Gate can suggest missing context items when validation fails
- [ ] Failed validations produce actionable, specific feedback

---

## File Scope

- `packages/core/src/workflow/gates/session-handoff.ts`

---

## Dependencies

- Task 001 (handoff-types.ts)
- Task 002 (handoff-validation.ts)

---

## Implementation Notes

Follow the pattern in `packages/core/src/chain/completion-gate.ts`:
- Resolve task/chain if not provided
- Call validation runner with options
- Return structured result

The gate should be usable both:
1. Programmatically via `runSessionHandoffGate()`
2. As a workflow stage gate type

Suggestion generation:
- If handoff_notes fails, suggest the context template from CR
- If uncommitted_work fails, list the uncommitted files
- If role_match fails, explain expected vs actual role

---

## Completion Notes

[Added when task is complete]
