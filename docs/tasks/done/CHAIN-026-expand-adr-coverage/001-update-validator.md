# Task: Update Validator Patterns

**Chain**: CHAIN-026-expand-adr-coverage  
**Task**: 001-update-validator  
**Type**: implementation  
**Status**: todo  

---

## Objective

Expand `scripts/validate-source-adr-references.mjs` to cover additional executable artifact patterns.

---

## Current State

The validator only checks `packages/*/src/**/*.ts` files.

---

## New Patterns to Add

| Pattern | File Types | ADR Comment Format |
|---------|------------|-------------------|
| `.github/workflows/*.yml` | CI/CD | `# ADR: ADR-xxx` |
| `scripts/*.mjs` | Validation scripts | `* ADR: ADR-xxx` (JSDoc) |
| `eslint.config.mjs` | ESLint config | `* ADR: ADR-xxx` |
| `githooks/*` | Git hooks | `# ADR: ADR-xxx` |

---

## Implementation

1. Add new file patterns to the validator
2. Support different comment formats per file type:
   - YAML: `# ADR: ADR-xxx`
   - JS/MJS: `* ADR: ADR-xxx` or `// ADR: ADR-xxx`
   - Shell: `# ADR: ADR-xxx`
3. Add exemption support via `choragen.governance.yaml`

---

## Acceptance Criteria

- [ ] Validator checks `.github/workflows/*.yml`
- [ ] Validator checks `scripts/*.mjs`
- [ ] Validator checks `eslint.config.mjs`
- [ ] Validator checks `githooks/*`
- [ ] Exemption patterns work
- [ ] Clear error messages for missing ADR refs

---

## Files to Modify

- `scripts/validate-source-adr-references.mjs`
- `choragen.governance.yaml` (add exemption config)

---

## Verification

```bash
node scripts/validate-source-adr-references.mjs
```
