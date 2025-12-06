# Task: Update Task Template with Type Field

**Chain**: CHAIN-013-control-task-cleanup  
**Task**: 002-update-task-template  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add optional `**Type**` field to task template to distinguish control vs implementation tasks.

---

## Expected Files

Update:
- `templates/task.md`

---

## Changes Required

Add after the `**Status**` line in the task template header:

```markdown
**Type**: implementation  
```

Add a comment or note explaining:
- `implementation` (default) - handed off to impl agent
- `control` - executed by control agent directly

---

## Acceptance Criteria

- [ ] Task template includes `**Type**` field
- [ ] Field has sensible default (`implementation`)
- [ ] Brief explanation of type values included

---

## Verification

```bash
cat templates/task.md | head -20
```
