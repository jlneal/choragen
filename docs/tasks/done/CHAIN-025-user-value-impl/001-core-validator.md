# Task: Implement Core Validator

**Chain**: CHAIN-025-user-value-impl  
**Task**: 001-core-validator  
**Type**: implementation  
**Status**: todo  

---

## Objective

Create `scripts/validate-user-value-traceability.mjs` implementing Rules 1-4 from the design doc.

---

## Context

The design doc (`docs/design/core/features/user-value-traceability.md`) defines 4 new validation rules:

1. **Rule 1**: Scenario → Persona (warning)
2. **Rule 2**: Use Case → Scenario (warning)
3. **Rule 3**: Feature → Scenario/Use Case (error)
4. **Rule 4**: CR → Feature (error)

Rules 5-6 (ADR → CR, Source → ADR) are already implemented in existing validators.

---

## Implementation Requirements

### Script Structure

```javascript
#!/usr/bin/env node
/**
 * Validates user value traceability chain
 * 
 * Rules:
 * 1. Scenarios must link to personas
 * 2. Use cases must link to scenarios
 * 3. Features must link to scenarios or use cases
 * 4. CRs must link to features
 *
 * ADR: ADR-001-task-file-format
 */
```

### For Each Rule

1. Collect files matching the pattern
2. Parse markdown to find required section
3. Check section has non-empty, non-placeholder content
4. Report pass/fail with standardized error format

### Error Message Format

```
❌ [RULE-N] <description>
   File: <path>
   Expected: <what should be there>
   Found: <what was found>
   Fix: <how to fix>
```

### Exit Codes

- Exit 0: All rules pass (warnings allowed)
- Exit 1: Any error-level rule fails (Rules 3-4)

---

## Acceptance Criteria

- [ ] Script exists at `scripts/validate-user-value-traceability.mjs`
- [ ] Rule 1 validates scenarios have Linked Personas
- [ ] Rule 2 validates use cases have Related Scenarios
- [ ] Rule 3 validates features have Linked Scenarios or Linked Use Cases
- [ ] Rule 4 validates CRs have feature docs in Affected Design Documents
- [ ] Rules 1-2 report as warnings (don't fail build)
- [ ] Rules 3-4 report as errors (fail build)
- [ ] Summary output shows pass/fail counts per rule
- [ ] Script runs successfully: `node scripts/validate-user-value-traceability.mjs`

---

## Files to Create

- `scripts/validate-user-value-traceability.mjs`

---

## Reference

- Design doc: `docs/design/core/features/user-value-traceability.md`
- Similar validator: `scripts/validate-design-doc-content.mjs`

---

## Verification

```bash
node scripts/validate-user-value-traceability.mjs
echo "Exit code: $?"
```
