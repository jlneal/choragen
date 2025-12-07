# Feature: Chain Types

**Domain**: core  
**Created**: 2025-12-07  
**Status**: Implemented  

---

## Overview

Chains are typed as either `design` or `implementation` to enforce the design-first workflow. Implementation chains must depend on a design chain or explicitly justify skipping design.

---

## Design vs Implementation Chains

### Design Chains

Design chains focus on WHAT to build:

- Create design documents
- Define acceptance criteria
- Document architecture decisions
- No code implementation

```bash
choragen chain:new:design CR-20251207-001 user-profile "User Profile Feature"
```

### Implementation Chains

Implementation chains focus on HOW to build:

- Write code per design specifications
- Create tests
- Must reference design chain or justify skipping

```bash
choragen chain:new:impl CR-20251207-001 user-profile-impl "Implement User Profile" \
  --depends-on=CHAIN-001-user-profile
```

---

## Chain Pairing Concept

Design and implementation chains form pairs:

```
CR-20251207-001 (Change Request)
  ├── CHAIN-001-user-profile (design)
  │     └── Tasks: create design doc, define API, write ADR
  │
  └── CHAIN-002-user-profile-impl (implementation)
        ├── depends-on: CHAIN-001-user-profile
        └── Tasks: implement API, write tests, integrate
```

Benefits:
- **Traceability** - Implementation traces back to design
- **Review gates** - Design must be approved before implementation starts
- **Separation of concerns** - Different agents can work on design vs implementation

---

## Chain Type Field

The `type` field in chain metadata:

```typescript
interface Chain {
  id: string;
  type?: ChainType;  // "design" | "implementation"
  dependsOn?: string;
  skipDesign?: boolean;
  skipDesignJustification?: string;
  // ...
}
```

Valid values:
- `"design"` - Design-focused chain
- `"implementation"` - Implementation-focused chain
- `undefined` - Legacy chain (backward compatibility)

---

## dependsOn for Chain Dependencies

Implementation chains use `dependsOn` to link to their design chain:

```bash
choragen chain:new:impl CR-001 profile-impl "Implement Profile" \
  --depends-on=CHAIN-001-profile-design
```

This creates:
- Explicit dependency relationship
- Validation that design chain exists
- Traceability from implementation to design

---

## skipDesign Flag

For cases where design is not needed, use `--skip-design` with justification:

```bash
choragen chain:new:impl FR-001 hotfix-login "Fix Login Bug" \
  --skip-design="Hotfix for production issue, design not required"
```

### When skipDesign is Appropriate

| Scenario | Appropriate? |
|----------|--------------|
| Hotfix for production bug | Yes |
| Trivial change (typo fix) | Yes |
| Documentation-only change | Yes |
| New feature | No |
| Architecture change | No |
| API change | No |

### Validation

The `validate-chain-types.mjs` script enforces:

- Implementation chains must have `dependsOn` OR `skipDesign`
- `skipDesign` must have justification
- Design chains should not have `dependsOn` (they are the root)

---

## CLI Commands

### Create Design Chain

```bash
choragen chain:new:design <request-id> <slug> [title]
```

### Create Implementation Chain

```bash
# With design dependency
choragen chain:new:impl <request-id> <slug> [title] --depends-on=CHAIN-xxx

# With skip justification
choragen chain:new:impl <request-id> <slug> [title] --skip-design="justification"
```

### Generic Chain Creation

```bash
choragen chain:new <request-id> <slug> [title] --type=design
choragen chain:new <request-id> <slug> [title] --type=implementation --depends-on=CHAIN-xxx
```

---

## Workflow Example

### 1. Create Change Request

```bash
choragen cr:new user-profile "Add user profile feature"
# Creates: CR-20251207-001
```

### 2. Create Design Chain

```bash
choragen chain:new:design CR-20251207-001 user-profile "User Profile Design"
# Creates: CHAIN-001-user-profile [design]
```

### 3. Add Design Tasks

```bash
choragen task:add CHAIN-001-user-profile design-doc "Create design document"
choragen task:add CHAIN-001-user-profile api-spec "Define API specification"
```

### 4. Complete Design Chain

Work through design tasks, get approval.

### 5. Create Implementation Chain

```bash
choragen chain:new:impl CR-20251207-001 user-profile-impl "User Profile Implementation" \
  --depends-on=CHAIN-001-user-profile
# Creates: CHAIN-002-user-profile-impl [implementation]
```

### 6. Add Implementation Tasks

```bash
choragen task:add CHAIN-002-user-profile-impl api-impl "Implement API endpoints"
choragen task:add CHAIN-002-user-profile-impl tests "Write tests"
```

---

## Acceptance Criteria

- [ ] Chains can be typed as design or implementation
- [ ] Implementation chains require dependsOn or skipDesign
- [ ] skipDesign requires justification string
- [ ] CLI provides shorthand commands for each chain type
- [ ] Validation script enforces chain type constraints
- [ ] Chain pairing enables design-first workflow

---

## Linked Scenarios

- [Control Agent Workflow](../scenarios/control-agent-workflow.md)

---

## Linked ADRs

- [ADR-006: Chain Type System](../../adr/done/ADR-006-chain-type-system.md)

---

## Implementation

- `packages/core/src/tasks/types.ts`
