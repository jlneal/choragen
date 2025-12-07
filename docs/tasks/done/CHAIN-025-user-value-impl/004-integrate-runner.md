# Task: Integrate with Validator Runner

**Chain**: CHAIN-025-user-value-impl  
**Task**: 004-integrate-runner  
**Type**: implementation  
**Status**: todo  

---

## Objective

Integrate the user value traceability validator into `run-validators.mjs` so it runs as part of `pnpm validate:all`.

---

## Context

The project uses `scripts/run-validators.mjs` to run all validation scripts. The new validator needs to be added to this runner.

---

## Implementation Requirements

### Add to run-validators.mjs

Add the new validator to the validators array:

```javascript
const validators = [
  // ... existing validators
  {
    name: "User Value Traceability",
    script: "validate-user-value-traceability.mjs",
    description: "Validates traceability from implementation to user value",
  },
];
```

### Verify Integration

Run the full validation suite and ensure the new validator is included.

---

## Acceptance Criteria

- [ ] `validate-user-value-traceability.mjs` is in run-validators.mjs
- [ ] `pnpm validate:all` includes user value validation
- [ ] Full validation suite passes

---

## Files to Modify

- `scripts/run-validators.mjs`

---

## Verification

```bash
pnpm validate:all
```
