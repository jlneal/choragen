# Task: Add ADR References to Existing Files

**Chain**: CHAIN-026-expand-adr-coverage  
**Task**: 002-add-adr-refs  
**Type**: implementation  
**Status**: todo  

---

## Objective

Add ADR references to existing scripts and config files, or create new ADRs where needed.

---

## Files Needing ADR References

### Scripts (scripts/*.mjs)

Most scripts already have `* ADR: ADR-001-task-file-format` or similar. Verify all have refs.

### Config Files

| File | Governing ADR | Action |
|------|---------------|--------|
| `eslint.config.mjs` | ADR-002-governance-schema? | Add ref or create ADR |
| `tsconfig.json` | ? | May need new ADR for build config |
| `turbo.json` | ? | May need new ADR for monorepo config |

### Git Hooks (githooks/*)

| File | Governing ADR | Action |
|------|---------------|--------|
| `pre-commit` | ADR-002-governance-schema | Add ref |
| `commit-msg` | ADR-002-governance-schema | Add ref |
| `pre-push` | ADR-002-governance-schema | Add ref |

### CI (when created)

| File | Governing ADR | Action |
|------|---------------|--------|
| `.github/workflows/ci.yml` | New ADR needed | Create ADR-007-ci-pipeline |

---

## Strategy

1. **Existing ADRs**: Add refs to files governed by existing ADRs
2. **New ADRs**: Create minimal ADRs for config decisions if needed
3. **Exemptions**: Config files that are truly boilerplate can be exempted

---

## Acceptance Criteria

- [ ] All scripts have ADR references
- [ ] Git hooks have ADR references
- [ ] Config files have ADR refs or are exempted with justification
- [ ] Validator passes

---

## Verification

```bash
node scripts/validate-source-adr-references.mjs
```
