# Task: Verify and Close CR

**Chain**: CHAIN-025-user-value-impl  
**Task**: 005-verify-close  
**Type**: control  
**Status**: todo  

---

## Objective

Verify all implementation is complete and close CR-20251207-002.

---

## Verification Checklist

### Validator Implementation
- [ ] `scripts/validate-user-value-traceability.mjs` exists
- [ ] Rules 1-4 implemented and working
- [ ] Error messages follow standard format
- [ ] Exit codes correct (0 for pass/warnings, 1 for errors)

### Exemption Handling
- [ ] Pattern-based exemptions work
- [ ] Inline markers work
- [ ] Invalid exemptions are rejected
- [ ] `--list-exemptions` flag works

### Configuration
- [ ] `choragen.governance.yaml` has baseline config
- [ ] Appropriate exemptions for existing code
- [ ] Validator passes on current codebase

### Integration
- [ ] Validator in `run-validators.mjs`
- [ ] `pnpm validate:all` passes

### Documentation
- [ ] Design doc updated with implementation references
- [ ] AGENTS.md updated if needed

---

## Post-Verification Actions

1. Move all task files to `done/CHAIN-025-user-value-impl/`
2. Update CR-20251207-002 with completion notes
3. Move CR to `done/`
4. Commit with proper format

---

## Commit Format

```
feat(validation): implement user value traceability

- Add validate-user-value-traceability.mjs
- Implement Rules 1-4 (Scenario→Persona, UseCase→Scenario, Feature→Scenario/UC, CR→Feature)
- Add exemption handling (pattern-based and inline markers)
- Configure baseline exemptions for existing code
- Integrate with validate:all

CR-20251207-002
```
