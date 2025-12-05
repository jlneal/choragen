# ADR-002: Governance Schema Design

**Status**: Done  
**Created**: 2025-12-05  
**Linked CR**: CR-20251205-001  

---

## Context

Agents need guardrails for file mutations. Some files should be freely editable, some require human approval, and some should never be touched. We need a declarative way to express these policies.

---

## Decision

### Schema Format

Governance rules are defined in `choragen.governance.yaml`:

```yaml
mutations:
  allow:
    - pattern: "components/**/*.tsx"
      actions: [create, modify]
    - pattern: "__tests__/**/*"
      actions: [create, modify, delete]
  
  approve:
    - pattern: "supabase/migrations/*.sql"
      actions: [create, modify]
      reason: "Schema changes require review"
  
  deny:
    - pattern: "*.key"
    - pattern: ".env*"

collision_detection:
  strategy: "file-lock"
  on_collision: "block"
```

### Rule Priority

1. **Deny** rules are checked first (highest priority)
2. **Approve** rules are checked second
3. **Allow** rules are checked last
4. If no rule matches, the mutation is **denied**

### Glob Pattern Support

- `*` matches anything except `/`
- `**` matches anything including `/`
- `**/` matches zero or more directories
- `/**` matches zero or more path segments at end
- `?` matches single character except `/`

### Actions

- `create` - Creating a new file
- `modify` - Modifying an existing file
- `delete` - Deleting a file

---

## Consequences

**Positive**:
- Declarative, version-controlled policies
- Clear precedence rules
- Human-readable format
- Glob patterns are familiar to developers

**Negative**:
- Simple YAML parser (no anchors, complex types)
- Glob matching has edge cases
- No inheritance or composition of schemas

**Mitigations**:
- Comprehensive test coverage for glob matching
- Default-deny policy prevents accidental mutations

---

## Implementation

- `packages/core/src/governance/types.ts`
- `packages/core/src/governance/governance-parser.ts`
- `packages/core/src/governance/governance-checker.ts`
- `packages/core/src/utils/glob.ts`
