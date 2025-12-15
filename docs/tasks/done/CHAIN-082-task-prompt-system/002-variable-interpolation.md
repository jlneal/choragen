# Task: Implement variable interpolation system for task prompts

**Chain**: CHAIN-082-task-prompt-system  
**Task**: 002-variable-interpolation  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Implement a variable interpolation system that replaces `{{variable}}` placeholders in task template `defaultPrompt` fields with actual task/chain context values.

---

## Context

This builds on task 001's schema. The interpolation system should reuse or align with existing patterns in workflow templates. Check `packages/cli/src/` for any existing interpolation utilities.

Core variables to support:
- `{{taskId}}` - Task identifier
- `{{taskTitle}}` - Task title
- `{{chainId}}` - Parent chain ID
- `{{requestId}}` - Linked request ID
- `{{domain}}` - Feature domain
- `{{acceptanceCriteria}}` - Formatted acceptance criteria list
- `{{objective}}` - Task objective text
- `{{context}}` - Task context section

---

## Expected Files

- `packages/core/src/interpolation.ts` or similar utility
- Unit tests for interpolation

---

## File Scope

- `packages/core/src/`
- `packages/core/src/__tests__/`

---

## Acceptance Criteria

- [ ] Interpolation function accepts template string and context object
- [ ] All core variables are supported
- [ ] Missing variables are handled gracefully (empty string or preserved placeholder)
- [ ] Unit tests cover all variable types
- [ ] Edge cases: nested braces, unknown variables, empty values

---

## Notes

- Check if workflow templates have existing interpolation code to reuse
- Consider whether to fail on unknown variables or silently skip

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
