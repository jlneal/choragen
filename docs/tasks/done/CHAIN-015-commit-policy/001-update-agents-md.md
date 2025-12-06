# Task: Update AGENTS.md with Commit Policy

**Chain**: CHAIN-015-commit-policy  
**Task**: 001-update-agents-md  
**Type**: implementation  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add commit policy to AGENTS.md documenting that control agents commit after chain completion.

---

## Expected Files

Update:
- `AGENTS.md`

---

## Changes Required

Add under "### Control Agent" section, after existing responsibilities:

```markdown
### Commit Policy

Control agents commit after each chain completion:

1. After moving all tasks to `done/`
2. Before starting the next chain
3. Use this commit message format:

```
<type>(<scope>): complete <CHAIN-ID>

- Task 1 summary
- Task 2 summary
- ...

<CR-xxx | FR-xxx>
```

Types: `feat` (new feature), `fix` (bug fix), `docs` (documentation), `chore` (maintenance)
```

---

## Acceptance Criteria

- [ ] AGENTS.md has "Commit Policy" section
- [ ] Commit message format documented
- [ ] Clear that control agent owns commits

---

## Verification

```bash
grep -A 15 "Commit Policy" AGENTS.md
```
