# ADR-006: Chain Type System

**Status**: Done  
**Created**: 2025-12-07  
**Linked CR**: CR-20251206-012  
**Linked Design Docs**: docs/design/core/features/chain-types.md

---

## Context

We need to distinguish design work from implementation work to:

1. **Enforce design-first** — Implementation should not start without design
2. **Enable traceability** — Implementation chains should link back to design chains
3. **Support exceptions** — Some work (hotfixes, trivial changes) legitimately skips design
4. **Maintain audit trail** — Decisions to skip design should be documented

---

## Decision

### Chain Types

Chains are typed as either `design` or `implementation`:

```typescript
interface Chain {
  id: string;
  type?: ChainType;  // "design" | "implementation"
  dependsOn?: string;
  skipDesign?: boolean;
  skipDesignJustification?: string;
}
```

### Design Chains

Focus on WHAT to build:
- Create design documents
- Define acceptance criteria
- Document architecture decisions
- No code implementation

### Implementation Chains

Focus on HOW to build:
- Write code per design specifications
- Create tests
- Must reference design chain OR justify skipping

### Chain Pairing

Design and implementation chains form pairs:

```
CR-20251207-001 (Change Request)
  ├── CHAIN-001-user-profile (design)
  │     └── Tasks: create design doc, define API, write ADR
  │
  └── CHAIN-002-user-profile-impl (implementation)
        ├── depends-on: CHAIN-001-user-profile
        └── Tasks: implement API, write tests
```

### skipDesign Flag

For justified exceptions, use `skipDesign` with required justification:

```bash
choragen chain:new:impl FR-001 hotfix-login "Fix Login Bug" \
  --skip-design="Hotfix for production issue, design not required"
```

Appropriate uses:
- Hotfixes for production bugs
- Trivial changes (typo fixes)
- Documentation-only changes

---

## Consequences

**Positive**:

- **Enforces design-first** — Implementation chains require design dependency or explicit skip
- **Clear audit trail** — Every skip decision is documented with justification
- **Traceability** — Implementation traces back to design through chain pairing
- **Review gates** — Design must be approved before implementation starts

**Negative**:

- **Bootstrap overhead** — Initial project setup requires design chains even for foundational work
- **Requires discipline** — Teams must follow the process consistently
- **Additional ceremony** — Creating paired chains adds steps to workflow

**Mitigations**:

- `skipDesign` flag allows justified exceptions
- CLI provides shorthand commands (`chain:new:design`, `chain:new:impl`)
- Validation scripts enforce constraints automatically
- Bootstrap work can use `skipDesign` with "bootstrap" justification

---

## Alternatives Considered

### Alternative 1: Single Chain Type

All chains are the same type, with design and implementation tasks mixed.

**Rejected because**: Blurs the line between design and implementation, makes it harder to enforce design-first workflow, and reduces traceability.

### Alternative 2: Mandatory Design Chains

Require design chain for all implementation chains, no exceptions.

**Rejected because**: Too rigid for legitimate exceptions like hotfixes and trivial changes. Would slow down urgent production fixes.

### Alternative 3: Implicit Chain Pairing

Automatically create paired chains when creating a CR.

**Rejected because**: Not all CRs need both design and implementation chains (e.g., documentation-only CRs). Explicit creation is more flexible.

---

## Implementation

- `packages/core/src/tasks/types.ts`
