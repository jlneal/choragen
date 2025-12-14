# Change Request: Session Handoff Gate

**ID**: CR-20251213-008  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-13  
**Owner**: agent  

---

## What

Introduce a **session handoff gate** that fires when control agent hands off to impl agent or vice versa. This ensures context is properly preserved and the receiving agent has what it needs.

This CR introduces:
1. A `session_handoff` gate type or validation hook
2. Context preservation verification
3. Task file state validation before handoff

---

## Why

Agent handoffs are critical transition points where context can be lost:
- Task files may not be properly formatted
- Previous session's work may not be committed
- Context notes may be missing or stale
- The receiving agent may not have clear instructions

A session handoff gate ensures clean transitions between agent sessions.

---

## Acceptance Criteria

- [ ] Handoff triggers validation before session ends
- [ ] Gate verifies task file is properly formatted
- [ ] Gate verifies previous work is committed (no uncommitted changes to task scope)
- [ ] Gate verifies handoff notes/context are present
- [ ] Gate validates receiving agent role matches task type
- [ ] Failed validations produce actionable feedback
- [ ] Gate can suggest missing context items

---

## Scope

**In scope:**
- Task file validation at handoff
- Uncommitted work detection
- Context/notes verification
- Role matching validation

**Out of scope:**
- Automated context summarization
- Cross-session memory persistence
- Agent capability verification

---

## Affected Design Documents

- [Standard Workflow](../../../design/core/features/standard-workflow.md) — Add session handoff concept
- [Specialized Agent Roles](../../../design/core/features/specialized-agent-roles.md) — Role transitions

---

## Linked ADRs

[Created during implementation]

---

## Commits

No commits yet.

---

## Task Chain

[Created during implementation]

---

## Implementation Notes

### Handoff Types

| From | To | Trigger |
|------|-----|---------|
| Control | Impl | Task assigned, ready for implementation |
| Impl | Control | Task complete, ready for review |
| Control | Control | Session timeout, context handoff |
| Impl | Impl | Session timeout, context handoff |

### Validation Checks

The session handoff gate should verify:

1. **Task file format** — Valid markdown, required sections present
2. **Uncommitted work** — No changes to files in task scope
3. **Handoff notes** — Context section updated with current state
4. **Role match** — Task type matches receiving agent role
5. **Blocking feedback** — No unresolved blocking feedback

### Context Preservation

```markdown
## Handoff Context

**Session**: 2025-12-13T23:15:00Z
**From**: control
**To**: impl
**State**: Task 003 ready for implementation

### What was done
- Created task file with acceptance criteria
- Verified dependencies are met

### What needs to happen
- Implement post-commit gate handler
- Add unit tests
- Update exports

### Open questions
- None
```

### Integration Points

- Workflow stage transitions
- Task status changes
- Session timeout handling
- Explicit handoff commands

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
