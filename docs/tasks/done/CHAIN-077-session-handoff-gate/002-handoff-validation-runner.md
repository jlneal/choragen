# Task: Implement Handoff Validation Runner

**ID**: 002  
**Chain**: CHAIN-077-session-handoff-gate  
**Type**: impl  
**Status**: todo  
**Created**: 2025-12-14  

---

## Description

Implement the validation runner that executes handoff checks. Each check validates a specific aspect of the handoff:

1. **task_format** — Task file is valid markdown with required sections
2. **uncommitted_work** — No uncommitted changes to files in task scope
3. **handoff_notes** — Handoff context section is present and populated
4. **role_match** — Task type matches receiving agent role
5. **blocking_feedback** — No unresolved blocking feedback items

---

## Acceptance Criteria

- [ ] `runHandoffValidation()` function implemented
- [ ] `runTaskFormatCheck()` validates task file structure
- [ ] `runUncommittedWorkCheck()` detects uncommitted changes in scope
- [ ] `runHandoffNotesCheck()` verifies context section exists
- [ ] `runRoleMatchCheck()` validates from/to roles match task type
- [ ] `runBlockingFeedbackCheck()` checks for unresolved blocking feedback
- [ ] Each check returns actionable feedback on failure
- [ ] Checks can be configured (enable/disable, required vs optional)

---

## File Scope

- `packages/core/src/workflow/gates/handoff-validation.ts`

---

## Dependencies

- Task 001 (handoff-types.ts)

---

## Implementation Notes

Follow the pattern in `packages/core/src/chain/validation-runner.ts`:
- Use switch statement to dispatch checks
- Each check is an async function returning `HandoffValidationOutcome`
- Use git status for uncommitted work detection
- Parse task markdown for format and notes checks

For role matching:
- `impl` tasks should hand off to impl agent
- `control` tasks should hand off to control agent
- Review tasks can go to either

---

## Completion Notes

[Added when task is complete]
