# Task: Add role boundaries section to AGENTS.md

**Chain**: CHAIN-036-role-boundaries  
**Task**: 001-add-role-boundaries  
**Status**: todo  
**Type**: impl  
**Created**: 2025-12-08

---

## Objective

Add explicit role boundary rules to the root `AGENTS.md` file. These rules are injected into agent context and serve as the authoritative source for what each role can and cannot do.

---

## Expected Files

- `Update:`
- `AGENTS.md — Add "Session Role Declaration" and "Role Boundaries" sections`

---

## Acceptance Criteria

- [ ] AGENTS.md includes "Session Role Declaration" section requiring agents to declare their role
- [ ] AGENTS.md includes "Role Boundaries" section with explicit allow/deny patterns
- [ ] Control agent restrictions documented: no editing packages/*/src/**, no creating tests
- [ ] Impl agent restrictions documented: no moving docs/tasks/**, no git commit, no creating CRs/FRs
- [ ] File patterns are structured to enable future programmatic extraction

---

## Notes

The role boundaries should mirror the governance schema format for future CLI enforcement:

```markdown
### If ROLE = impl
- ✅ ALLOW: `packages/**/src/**/*.ts` (create, modify)
- ✅ ALLOW: `packages/**/__tests__/**/*.ts` (create, modify, delete)
- ❌ DENY: `docs/tasks/**` (move, delete)
- ❌ DENY: `git commit`

### If ROLE = control
- ✅ ALLOW: `docs/**/*.md` (create, modify, move, delete)
- ❌ DENY: `packages/**/src/**/*.ts` (create, modify)
```

**Verification**:
```bash
grep -A 20 "Role Boundaries" AGENTS.md
grep -A 10 "Session Role Declaration" AGENTS.md
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
