# Change Request: Governance Schema Role Extension

**ID**: CR-20251207-020  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-07  
**Owner**: control-agent  

---

## What

Extend `choragen.governance.yaml` schema to support role-based access control. Add a `roles` section that defines per-role allow/deny patterns, enabling programmatic enforcement of role boundaries.

---

## Why

The current governance schema has `mutations.allow`, `mutations.approve`, and `mutations.deny` sections, but these apply globally—not per role. To enforce role boundaries deterministically, the schema needs to express "impl agents can modify source code but not task files" and "control agents can modify docs but not source code."

This schema extension is the foundation for CLI enforcement (CR-20251207-021).

---

## Scope

**In Scope**:
- Add `roles` section to governance schema
- Define `roles.impl.allow`, `roles.impl.deny` patterns
- Define `roles.control.allow`, `roles.control.deny` patterns
- Update `@choragen/core` to parse role-based rules
- Update governance validation to support role context

**Out of Scope**:
- CLI enforcement commands (CR-20251207-021)
- Session context tracking
- Runtime role switching

---

## Affected Design Documents

- [docs/design/core/features/agent-workflow.md](../../design/core/features/agent-workflow.md)
- [docs/design/core/features/governance-enforcement.md](../../design/core/features/governance-enforcement.md)

---

## Linked ADRs

- [ADR-002: Governance Schema](../../adr/done/ADR-002-governance-schema.md)
- [ADR-004: Agent Role Separation](../../adr/done/ADR-004-agent-role-separation.md)

---

## Acceptance Criteria

- [ ] `choragen.governance.yaml` schema supports `roles` section
- [ ] `roles.impl` defines allow/deny patterns for implementation agents
- [ ] `roles.control` defines allow/deny patterns for control agents
- [ ] `@choragen/core` exports types for role-based governance rules
- [ ] `@choragen/core` can validate a file mutation against a specific role
- [ ] Existing global rules continue to work (backward compatible)

---

## Commits

No commits yet.

---

## Implementation Notes

Proposed schema structure:

```yaml
roles:
  impl:
    allow:
      - pattern: "packages/**/src/**/*.ts"
        actions: [create, modify]
      - pattern: "packages/**/__tests__/**/*.ts"
        actions: [create, modify, delete]
    deny:
      - pattern: "docs/tasks/**"
        actions: [move, delete]
      - pattern: "docs/requests/**"
        actions: [create]
      - pattern: ".choragen/**"
        actions: [modify]
        
  control:
    allow:
      - pattern: "docs/**/*.md"
        actions: [create, modify, move, delete]
      - pattern: ".choragen/**"
        actions: [modify]
    deny:
      - pattern: "packages/**/src/**/*.ts"
        actions: [create, modify]
      - pattern: "packages/**/__tests__/**/*.ts"
        actions: [create, modify]
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
