# Task: Configure Baseline Exemptions

**Chain**: CHAIN-025-user-value-impl  
**Task**: 003-configure-baseline  
**Type**: implementation  
**Status**: todo  

---

## Objective

Configure exemption patterns for the existing codebase so the validator passes. This includes setting the baseline date and adding pattern exemptions for tooling.

---

## Context

The current codebase predates user value traceability enforcement. We need to:

1. Set baseline date to today (2025-12-07)
2. Add pattern exemptions for scripts, CI, etc.
3. Ensure validator passes on current code

---

## Implementation Requirements

### Update choragen.governance.yaml

Add user-value-traceability configuration:

```yaml
validation:
  user-value-traceability:
    baseline-date: "2025-12-07"
    pre-baseline-behavior: "warn"
    
    exempt-patterns:
      - pattern: "scripts/**/*.mjs"
        category: "build-tooling"
        justification: "Validation scripts support development workflow"
      
      - pattern: "docs/design/DEVELOPMENT_PIPELINE.md"
        category: "framework-docs"
        justification: "Meta-documentation about the pipeline itself"
```

### Verify Current State

Run validator and identify any failures that need exemptions or fixes.

---

## Acceptance Criteria

- [ ] `choragen.governance.yaml` has user-value-traceability config
- [ ] Baseline date set to 2025-12-07
- [ ] Scripts directory is exempted
- [ ] Framework docs are exempted
- [ ] Validator passes on current codebase
- [ ] No errors (warnings acceptable for pre-baseline files)

---

## Files to Modify

- `choragen.governance.yaml`

---

## Verification

```bash
node scripts/validate-user-value-traceability.mjs
echo "Exit code: $?"
# Should be 0
```
