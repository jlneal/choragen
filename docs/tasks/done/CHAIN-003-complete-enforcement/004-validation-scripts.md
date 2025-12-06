# Task: Add validation scripts

**Chain**: CHAIN-003-complete-enforcement  
**Task**: 004-validation-scripts  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add validation scripts for CI and manual verification. These complement ESLint rules with cross-file checks.

---

## Expected Files

- `Create in scripts/:`
- `validate-commit-traceability.mjs - Check commits reference CR/FR`
- `validate-agents-md.mjs - Check AGENTS.md presence in key directories`
- `Update:`
- `package.json - Add script commands`

---

## Acceptance Criteria

- [ ] validate-commit-traceability script implemented
- [ ] validate-agents-md script implemented
- [ ] Scripts added to package.json
- [ ] Scripts executable and working
- [ ] pnpm validate:all includes new scripts

---

## Notes

**validate-commit-traceability**:
- Checks recent commits (configurable range)
- Validates CR/FR references exist in docs/requests/
- Exempt types: chore(deps), chore(format), chore(planning), ci, build

**validate-agents-md**:
- Checks for AGENTS.md in: packages/*, scripts/, docs/, templates/, githooks/
- Reports missing files
- Exit 1 if any missing

Add to package.json:
```json
"validate:commits": "node scripts/validate-commit-traceability.mjs",
"validate:agents": "node scripts/validate-agents-md.mjs"
```

Update validate:all to include new scripts.
