# Task: Define Validation Rules

**Chain**: CHAIN-024-user-value-design  
**Task**: 002-define-validation-rules  
**Type**: implementation  
**Status**: todo  

---

## Objective

Define the specific validation rules that will enforce user value traceability. Document what passes, what fails, and the error messages.

---

## Context

We need clear, enforceable rules for each link in the chain. The validator needs to know exactly what to check.

---

## Rules to Define

### Rule 1: Scenarios must link to Personas
- **Check**: Scenario docs have non-empty "Linked Personas" section
- **Pass**: At least one persona linked with valid path
- **Fail**: Missing section, empty section, or broken link

### Rule 2: Use Cases must link to Scenarios
- **Check**: Use case docs have non-empty "Linked Scenario" section
- **Pass**: Links to valid scenario doc
- **Fail**: Missing section, empty section, or broken link

### Rule 3: Features must link to Scenarios or Use Cases
- **Check**: Feature docs have "Linked Scenarios" or "Linked Use Cases" section
- **Pass**: At least one valid link
- **Fail**: No links to user value

### Rule 4: CRs must link to Features
- **Check**: CR "Affected Design Documents" includes feature docs
- **Pass**: At least one feature doc linked
- **Fail**: No feature docs (only ADRs or nothing)

### Rule 5: ADRs must link to CRs (existing rule)
- Already enforced by `validate-adr-traceability.mjs`

### Rule 6: Source files must link to ADRs (existing rule)
- Already enforced by `validate-source-adr-references.mjs`

---

## Acceptance Criteria

- [ ] Create design doc: `docs/design/core/features/user-value-traceability.md`
- [ ] Document each validation rule with:
  - What is checked
  - Pass criteria
  - Fail criteria
  - Error message format
- [ ] Define validation order (which rules run first)
- [ ] Document how rules compose (if Rule 4 passes but Rule 3 fails, what happens?)

---

## Files to Create

- `docs/design/core/features/user-value-traceability.md`

---

## Verification

```bash
cat docs/design/core/features/user-value-traceability.md | head -100
```
