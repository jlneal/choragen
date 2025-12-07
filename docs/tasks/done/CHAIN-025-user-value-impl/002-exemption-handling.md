# Task: Implement Exemption Handling

**Chain**: CHAIN-025-user-value-impl  
**Task**: 002-exemption-handling  
**Type**: implementation  
**Status**: todo  

---

## Objective

Add exemption handling to the user value validator, supporting both pattern-based exemptions (from config) and inline markers.

---

## Context

The design doc defines two exemption mechanisms:

1. **Pattern-based**: Configured in `choragen.governance.yaml`
2. **Inline markers**: `@exempt`, `@exempt-category`, `@exempt-reason` in files

---

## Implementation Requirements

### Pattern-Based Exemptions

Read from `choragen.governance.yaml`:

```yaml
validation:
  user-value-traceability:
    exempt-patterns:
      - pattern: "scripts/**/*.mjs"
        category: "build-tooling"
        justification: "Build scripts support development"
```

### Inline Marker Detection

Parse files for:
- `@exempt user-value-traceability`
- `@exempt-category <category>`
- `@exempt-reason <text>`

Support formats:
- JS/TS: `/** @exempt ... */` or `// @exempt ...`
- Markdown: `<!-- @exempt ... -->`
- YAML: `# @exempt ...`

### Exemption Validation

Reject exemptions that:
- Have no `@exempt-reason`
- Have placeholder justification ("TODO", "TBD")
- Use invalid category

### Categories

Valid categories: `build-tooling`, `ci-cd`, `generated`, `framework-docs`, `internal-utility`, `legacy`

---

## Acceptance Criteria

- [ ] Pattern-based exemptions are read from governance config
- [ ] Inline markers are detected in JS/TS, Markdown, YAML files
- [ ] Exemptions without justification are rejected
- [ ] Placeholder justifications are rejected
- [ ] Invalid categories are rejected
- [ ] Exempted files are skipped in validation
- [ ] `--list-exemptions` flag shows all exemptions

---

## Files to Modify

- `scripts/validate-user-value-traceability.mjs`

---

## Verification

```bash
# Test with exemptions
node scripts/validate-user-value-traceability.mjs

# List exemptions
node scripts/validate-user-value-traceability.mjs --list-exemptions
```
