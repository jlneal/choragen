# Task: Verify and Close CR

**Chain**: CHAIN-016-agentic-chassis  
**Task**: 008-verify-close  
**Type**: control  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Verify the agentic chassis is complete and close CR-20251206-007.

---

## Expected Files

Update:
- `docs/requests/change-requests/done/CR-20251206-007-complete-agentic-chassis.md`

---

## Verification Checklist

### Git Hooks
- [ ] Pre-commit runs contextual validations
- [ ] Pre-commit blocks on validation failures
- [ ] Commit-msg BLOCKS commits to todo/ requests
- [ ] Commit-msg BLOCKS commits to archived requests

### ESLint
- [ ] `@choragen/eslint-plugin` rules enforced
- [ ] `pnpm lint` passes on choragen codebase

### CLI Commands
- [ ] `choragen cr:new` works
- [ ] `choragen fr:new` works
- [ ] `choragen adr:new` works
- [ ] `choragen design:new` works
- [ ] `choragen validate:all` works
- [ ] `choragen work:incomplete` works

### Documentation
- [ ] AGENTS.md has common patterns section
- [ ] AGENTS.md has validation commands reference
- [ ] AGENTS.md is 400+ lines

### Task Runner
- [ ] `node scripts/run.mjs help` works
- [ ] `node scripts/run.mjs build` works
- [ ] `node scripts/run.mjs validate:all` works

### Self-Validation
- [ ] All validation scripts pass on choragen itself
- [ ] `choragen validate:all` exits 0

---

## Acceptance Criteria

- [ ] All verification checklist items pass
- [ ] CR moved to done/ with completion notes
- [ ] Chain committed

---

## Notes

This task demonstrates the completed chassis by using it to verify itself.
