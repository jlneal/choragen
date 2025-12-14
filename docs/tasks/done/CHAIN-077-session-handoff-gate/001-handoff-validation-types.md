# Task: Define Handoff Validation Types

**ID**: 001  
**Chain**: CHAIN-077-session-handoff-gate  
**Type**: impl  
**Status**: done  
**Created**: 2025-12-14  

---

## Description

Define TypeScript types for session handoff validation. This includes:
- Handoff validation check types (task_format, uncommitted_work, handoff_notes, role_match, blocking_feedback)
- Handoff context structure
- Validation result types
- Configuration options

---

## Acceptance Criteria

- [ ] `HandoffValidationCheck` type defined with all check types
- [ ] `HANDOFF_VALIDATION_CHECKS` constant array defined
- [ ] `HandoffContext` interface defined (session, from, to, state, what_done, what_next, open_questions)
- [ ] `HandoffValidationResult` and outcome types defined
- [ ] `HandoffValidationConfig` interface defined
- [ ] `SessionHandoffGateResult` aggregate result type defined

---

## File Scope

- `packages/core/src/workflow/gates/handoff-types.ts`

---

## Dependencies

None

---

## Implementation Notes

Follow the pattern established in `packages/core/src/chain/validation-types.ts`:
- Use discriminated union for success/failure outcomes
- Include `feedback` array for actionable messages
- Define config with default checks and overrides

Handoff types from CR:
| From | To | Trigger |
|------|-----|---------|
| Control | Impl | Task assigned, ready for implementation |
| Impl | Control | Task complete, ready for review |
| Control | Control | Session timeout, context handoff |
| Impl | Impl | Session timeout, context handoff |

---

## Completion Notes

Implemented `packages/core/src/workflow/gates/handoff-types.ts` with:
- `AgentRole` type for control/impl/review/design/orchestration
- `HandoffValidationCheck` type with 5 checks
- `HANDOFF_VALIDATION_CHECKS` constant array
- `HandoffContext` interface for session context preservation
- `HandoffValidationResult`, `HandoffValidationSuccess`, `HandoffValidationFailure` types
- `HandoffValidationOutcome` discriminated union
- `HandoffValidationConfig` interface
- `HandoffSuggestion` interface for actionable suggestions
- `SessionHandoffGateResult` aggregate result type
- `HANDOFF_CONTEXT_TEMPLATE` for suggestion generation
