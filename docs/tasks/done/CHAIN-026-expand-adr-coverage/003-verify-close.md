# Task: Verify and Close FR

**Chain**: CHAIN-026-expand-adr-coverage  
**Task**: 003-verify-close  
**Type**: control  
**Status**: todo  

---

## Objective

Verify all acceptance criteria are met and close FR-20251207-002.

---

## Verification Checklist

- [ ] Validator covers all executable artifact patterns
- [ ] Exemption mechanism works
- [ ] All scripts have ADR refs
- [ ] All git hooks have ADR refs
- [ ] Config files have refs or exemptions
- [ ] `node scripts/validate-source-adr-references.mjs` passes

---

## Post-Verification

1. Move task files to `done/CHAIN-026-expand-adr-coverage/`
2. Update FR with completion notes
3. Move FR to `done/`

---

## Commit Format

```
fix(validation): expand ADR reference coverage to all executables

- Extend validate-source-adr-references.mjs patterns
- Add ADR refs to scripts, hooks, configs
- Add exemption support for config files

FR-20251207-002
```
