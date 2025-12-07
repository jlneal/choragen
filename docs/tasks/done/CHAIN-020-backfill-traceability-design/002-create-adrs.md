# Task: Create missing ADRs

**Chain**: CHAIN-020-backfill-traceability-design  
**Task**: 002-create-adrs  
**Status**: todo  
**Created**: 2025-12-07

---

## Objective

Create 3 missing Architecture Decision Records for key architectural decisions that were made without documentation.

---

## Expected Files

- `Create in docs/adr/done/:`
- `1. ADR-004-agent-role-separation.md`
- `2. ADR-005-design-contract-api.md`
- `3. ADR-006-chain-type-system.md`

---

## Acceptance Criteria

- [ ] ### 1. ADR-004-agent-role-separation.md
- [ ] Context: Why agent role separation is needed
- [ ] Decision: Two-agent model with control and impl roles
- [ ] Consequences (positive): Context boundaries, review integrity, reproducibility
- [ ] Consequences (negative): Overhead, requires human coordination
- [ ] Mitigations: Control-only tasks for trivial work, future MCP automation
- [ ] Links to: CR-20251206-012, docs/design/core/features/agent-workflow.md
- [ ] ### 2. ADR-005-design-contract-api.md
- [ ] Context: Need for runtime traceability at API boundaries
- [ ] Decision: Function wrapper API with metadata attachment
- [ ] Alternatives considered: Class-only API, decorator pattern
- [ ] Consequences (positive): Simple API, matches documentation, inspectable
- [ ] Consequences (negative): Limited runtime validation (use Builder for that)
- [ ] Links to: CR-20251206-012, docs/design/core/features/design-contract.md
- [ ] ### 3. ADR-006-chain-type-system.md
- [ ] Context: Need to distinguish design work from implementation work
- [ ] Decision: Chain types (design/implementation) with optional pairing
- [ ] Decision: skipDesign flag for justified exceptions
- [ ] Consequences (positive): Enforces design-first, clear audit trail
- [ ] Consequences (negative): Bootstrap overhead, requires discipline
- [ ] Links to: CR-20251206-012, docs/design/core/features/chain-types.md

---

## Notes

Reference existing ADRs for format:
- `docs/adr/done/ADR-001-task-file-format.md`
- `docs/adr/done/ADR-002-governance-schema.md`

Each ADR should follow the standard structure:
- Title with ADR number
- Status: done (these are retroactive)
- Context
- Decision
- Consequences (positive and negative)
- Mitigations for negatives
- Linked CR/FR
- Linked Design Docs
