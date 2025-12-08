# Task: Extend governance schema with roles section

**Chain**: CHAIN-037-governance-roles  
**Task**: 001-extend-schema  
**Status**: backlog  
**Type**: impl  
**Created**: 2025-12-08

---

## Objective

Add a `roles` section to `choragen.governance.yaml` that defines per-role allow/deny patterns for impl and control agents.

---

## Expected Files

Update:
- `choragen.governance.yaml` — Add `roles` section with impl and control definitions

---

## Acceptance Criteria

- [ ] `choragen.governance.yaml` has a `roles` section at the top level
- [ ] `roles.impl.allow` defines patterns impl agents can modify
- [ ] `roles.impl.deny` defines patterns impl agents cannot touch
- [ ] `roles.control.allow` defines patterns control agents can modify
- [ ] `roles.control.deny` defines patterns control agents cannot touch
- [ ] Patterns mirror those defined in `AGENTS.md` Role Boundaries section
- [ ] Existing `mutations` section remains unchanged (backward compatible)

---

## Notes

The roles section should be added after `collision_detection` and before `validation`. Structure:

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
        actions: [create, modify, move]
      - pattern: "docs/adr/**"
        actions: [create, move]
        
  control:
    allow:
      - pattern: "docs/**/*.md"
        actions: [create, modify, move, delete]
      - pattern: "AGENTS.md"
        actions: [modify]
    deny:
      - pattern: "packages/**/src/**/*.ts"
        actions: [create, modify]
      - pattern: "packages/**/__tests__/**/*.ts"
        actions: [create, modify]
```

**Verification**:
```bash
cat choragen.governance.yaml | grep -A 30 "^roles:"
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
