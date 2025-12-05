# Feature: Governance Enforcement

**Domain**: core  
**Created**: 2025-12-05  
**Status**: Implemented  

---

## Overview

Governance rules define what file mutations agents are allowed to make. This prevents accidental or unauthorized changes to sensitive files.

---

## Capabilities

### Governance Check

```bash
choragen governance:check <action> <file1> [file2...]
```

Actions: `create`, `modify`, `delete`

### Policy Types

| Policy | Behavior |
|--------|----------|
| **allow** | Mutation proceeds without intervention |
| **approve** | Mutation requires human approval |
| **deny** | Mutation is blocked |

### Rule Priority

1. Deny rules (highest priority)
2. Approve rules
3. Allow rules
4. Default: deny (if no rule matches)

---

## Configuration

`choragen.governance.yaml`:

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
```

---

## Glob Patterns

| Pattern | Matches |
|---------|---------|
| `*` | Anything except `/` |
| `**` | Anything including `/` |
| `**/` | Zero or more directories |
| `/**` | Zero or more path segments at end |
| `?` | Single character except `/` |

---

## Linked ADRs

- [ADR-002: Governance Schema](../../adr/done/ADR-002-governance-schema.md)

---

## Linked Scenarios

- [Implementation Agent Workflow](../scenarios/implementation-agent-workflow.md)

---

## Implementation

- `packages/core/src/governance/`
- `packages/core/src/utils/glob.ts`
