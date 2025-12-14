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

## Commit Audits

Governance enforcement is complemented by **commit audits** — automated post-commit spot checks that review commits for standards compliance. While governance rules prevent unauthorized mutations at write time, audits provide advisory feedback after commits are created.

Audit findings are non-blocking and produce `audit` feedback items. Critical findings may spawn follow-up Fix Requests.

See [ADR-015: Commit Audit Mechanism](../../adr/done/ADR-015-commit-audit-mechanism.md) for details.

---

## Linked ADRs

- [ADR-002: Governance Schema](../../adr/done/ADR-002-governance-schema.md)
- [ADR-015: Commit Audit Mechanism](../../adr/done/ADR-015-commit-audit-mechanism.md)

---

## Linked Personas

- [AI Agent](../personas/ai-agent.md)
- [Solo Developer](../personas/solo-developer.md)
- [Team Lead](../personas/team-lead.md)
- [Open Source Maintainer](../personas/open-source-maintainer.md)

---

## Linked Use Cases

- [Create and Execute Task Chain](../use-cases/create-execute-task-chain.md)
- [Review and Approve Work](../use-cases/review-approve-work.md)

---

## Linked Scenarios

- [Implementation Agent Workflow](../scenarios/implementation-agent-workflow.md)

---

## Acceptance Criteria

- [ ] `governance:check` command validates file mutations against policy rules
- [ ] Allow rules permit mutations without intervention
- [ ] Approve rules require human approval before proceeding
- [ ] Deny rules block mutations entirely
- [ ] Rule priority is enforced: deny > approve > allow > default deny
- [ ] Glob patterns match files correctly (*, **, ?, etc.)
- [ ] Configuration is read from `choragen.governance.yaml`

---

## Implementation

- `packages/core/src/governance/`
- `packages/core/src/utils/glob.ts`
