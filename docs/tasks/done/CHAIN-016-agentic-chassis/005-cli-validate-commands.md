# Task: Add CLI Validation Commands

**Chain**: CHAIN-016-agentic-chassis  
**Task**: 005-cli-validate-commands  
**Type**: implementation  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add CLI wrappers for validation scripts. Make it easy to run validators without knowing script paths.

---

## Expected Files

Update:
- `packages/cli/src/cli.ts`

---

## Commands to Add

### Individual Validators
```bash
choragen validate:links
# Runs: node scripts/validate-links.mjs

choragen validate:adr-traceability
# Runs: node scripts/validate-adr-traceability.mjs

choragen validate:adr-staleness
# Runs: node scripts/validate-adr-staleness.mjs

choragen validate:source-adr-references
# Runs: node scripts/validate-source-adr-references.mjs

choragen validate:design-doc-content
# Runs: node scripts/validate-design-doc-content.mjs

choragen validate:request-staleness
# Runs: node scripts/validate-request-staleness.mjs

choragen validate:request-completion
# Runs: node scripts/validate-request-completion.mjs

choragen validate:commit-traceability
# Runs: node scripts/validate-commit-traceability.mjs

choragen validate:complete-traceability
# Runs: node scripts/validate-complete-traceability.mjs

choragen validate:contract-coverage
# Runs: node scripts/validate-contract-coverage.mjs

choragen validate:test-coverage
# Runs: node scripts/validate-test-coverage.mjs

choragen validate:chain-types
# Runs: node scripts/validate-chain-types.mjs

choragen validate:agents-md
# Runs: node scripts/validate-agents-md.mjs
```

### Aggregate Commands
```bash
choragen validate:all
# Runs all validators, reports summary

choragen validate:quick
# Runs fast validators only (links, agents-md)

choragen validate:ci
# Runs CI-appropriate validators (all blocking ones)
```

### Utility
```bash
choragen work:incomplete
# Lists:
# - TODOs/FIXMEs without CR/FR reference
# - CRs/FRs in doing/ for >3 days
# - ADRs in doing/ for >7 days
# - Tasks in todo/ for >7 days
```

---

## Implementation Notes

1. **Use child_process.spawn** to run scripts
2. **Stream output** to console in real-time
3. **Collect exit codes** for aggregate commands
4. **Format summary** for aggregate commands:
   ```
   Validation Results:
   ✅ links
   ✅ adr-traceability
   ⚠️  request-staleness (2 warnings)
   ❌ chain-types (3 errors)
   
   1 failed, 1 warning, 2 passed
   ```

---

## Acceptance Criteria

- [ ] All individual validate commands work
- [ ] `validate:all` runs all validators
- [ ] `validate:quick` runs fast validators
- [ ] `work:incomplete` shows incomplete work
- [ ] Exit codes are correct (0 = pass, 1 = fail)
- [ ] Help text lists all validate commands

---

## Verification

```bash
choragen validate:links
choragen validate:all
choragen work:incomplete
choragen help
```
