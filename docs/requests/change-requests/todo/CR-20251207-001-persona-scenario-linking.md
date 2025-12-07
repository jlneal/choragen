# Change Request: Persona-Scenario Value Linking

**ID**: CR-20251207-001  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-07  
**Owner**: agent  

---

## What

Add explicit persona-to-scenario linking through value statements. Each scenario should declare, for each relevant persona:
1. Which personas benefit from the scenario
2. What specific value each persona receives
3. Which personas are explicitly excluded (and why)

---

## Why

1. **Traceability** — Links user needs to implementation through explicit value statements
2. **Completeness** — Forces consideration of all personas for each scenario
3. **Prioritization** — Value statements help prioritize work based on persona impact
4. **Validation** — Enables verification that implementation delivers stated value

---

## Scope

**In Scope**:
- Define persona-value statement format in scenario template
- Update existing scenarios to include persona value statements
- Add validation for persona coverage in scenarios
- Document the linking pattern in design docs

**Out of Scope**:
- Persona definition/management (assume personas exist)
- Automated persona discovery
- Value quantification/metrics

---

## Proposed Format

```markdown
## Personas

### Control Agent
**Value**: [What value this scenario provides to control agents]

### Implementation Agent  
**Value**: [What value this scenario provides to impl agents]

### Human Operator
**Value**: [What value this scenario provides to human operators]
**Excluded**: [Optional - reason if this persona doesn't benefit]
```

---

## Affected Design Documents

- [docs/design/core/features/user-value-traceability.md](../../../design/core/features/user-value-traceability.md)

---

## Linked ADRs

None yet.

---

## Commits

No commits yet.

---

## Implementation Notes

Consider:
- Should exclusions require justification?
- Should value statements follow a template (e.g., "As a [persona], I can [action] so that [benefit]")?
- How to validate persona coverage?

---

## Completion Notes

[Added when moved to done/]
