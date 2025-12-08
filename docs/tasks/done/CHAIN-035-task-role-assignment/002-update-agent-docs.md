# Task: Update agent role documentation

**Chain**: CHAIN-035-task-role-assignment  
**Task**: 002-update-agent-docs  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-08

---

## Objective

Update `docs/agents/control-agent.md` and `docs/agents/impl-agent.md` to reference the task Type field and clarify how agents should use it.

---

## Expected Files

- `Update:`
- `docs/agents/control-agent.md — Reference Type field in control-only tasks section`
- `docs/agents/impl-agent.md — Reference Type field in how-to-start section`

---

## Acceptance Criteria

- [ ] control-agent.md "Control-Only Tasks" section references **Type**: control field
- [ ] impl-agent.md "How to Start" section mentions checking the Type field
- [ ] Both docs explain that impl agents should only work on Type: impl tasks
- [ ] Both docs explain that control agents execute Type: control tasks directly

---

## Notes

The control-agent.md already mentions marking control-only tasks with `**Type**: control` (line 256). This task ensures both docs are consistent and clear about the Type field's role.

**Verification**:
```bash
grep -n "Type" docs/agents/control-agent.md
grep -n "Type" docs/agents/impl-agent.md
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
