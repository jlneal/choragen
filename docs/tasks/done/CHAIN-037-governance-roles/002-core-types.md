# Task: Add role-based governance types to @choragen/core

**Chain**: CHAIN-037-governance-roles  
**Task**: 002-core-types  
**Status**: backlog  
**Type**: impl  
**Created**: 2025-12-08

---

## Objective

Add TypeScript types and parsing support for the new `roles` section in the governance schema. Enable programmatic validation of file mutations against a specific role.

---

## Expected Files

Update:
- `packages/core/src/governance/types.ts` — Add role-related types
- `packages/core/src/governance/governance-parser.ts` — Parse roles section
- `packages/core/src/governance/governance-checker.ts` — Add role-aware check function

Create:
- `packages/core/src/governance/__tests__/role-governance.test.ts` — Tests for role-based governance

---

## Acceptance Criteria

- [ ] `AgentRole` type exported: `"impl" | "control"`
- [ ] `RoleGovernanceRules` interface with `allow` and `deny` arrays
- [ ] `GovernanceSchema` extended with optional `roles` property
- [ ] `parseGovernanceYaml` parses the `roles` section
- [ ] `checkMutationForRole(file, action, role, schema)` function exported
- [ ] Tests verify role-based allow/deny logic
- [ ] Existing governance checks remain backward compatible

---

## Notes

New types to add to `types.ts`:

```typescript
export type AgentRole = "impl" | "control";

export interface RoleGovernanceRules {
  allow: MutationRule[];
  deny: MutationRule[];
}

// Extend GovernanceSchema:
export interface GovernanceSchema {
  mutations: { ... };
  collisionDetection?: CollisionConfig;
  roles?: {
    impl?: RoleGovernanceRules;
    control?: RoleGovernanceRules;
  };
}
```

New function signature:

```typescript
export function checkMutationForRole(
  file: string,
  action: MutationAction,
  role: AgentRole,
  schema: GovernanceSchema
): MutationCheckResult;
```

**Verification**:
```bash
pnpm build
pnpm --filter @choragen/core test
pnpm --filter @choragen/core typecheck
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
