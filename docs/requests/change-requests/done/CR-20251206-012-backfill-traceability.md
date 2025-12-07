# Change Request: Backfill Missing Traceability Artifacts

**ID**: CR-20251206-012  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-06  
**Owner**: agent  

---

## What

Create missing design documents and ADRs for features that were implemented without proper traceability. Add backward links from existing implementation artifacts.

---

## Why

1. **Traceability gap** — Multiple features exist without design docs or ADRs
2. **Consistency** — The system should follow its own rules
3. **Documentation** — Future agents need to understand WHY decisions were made
4. **Validation** — Traceability validators will fail without these artifacts

---

## Scope

### In Scope

**Missing Design Docs** (create in `docs/design/core/features/`):

1. **agent-workflow.md** — Two-agent model, control vs impl roles, handoff process
2. **design-contract.md** — DesignContract API, runtime validation, traceability enforcement
3. **cli-commands.md** — CLI structure, chain/task lifecycle, governance/lock commands
4. **eslint-plugin.md** — Rule categories, traceability rules, contract rules, hygiene rules
5. **validation-pipeline.md** — Scripts, git hooks, enforcement layers, CI integration
6. **chain-types.md** — Design vs implementation chains, skipDesign flag, chain pairing

**Missing ADRs** (create in `docs/adr/done/`):

1. **ADR-004-agent-role-separation.md** — Decision to use two-agent model
2. **ADR-005-design-contract-api.md** — Decision on DesignContract function wrapper API
3. **ADR-006-chain-type-system.md** — Decision on design/impl chain pairing

**Backlinks to add**:

- `docs/agents/*.md` → link to agent-workflow.md design doc
- `packages/contracts/src/design-contract.ts` → link to ADR-005
- `packages/core/src/tasks/types.ts` (Chain type) → link to ADR-006

### Out of Scope

- Rewriting existing implementation
- Creating new features
- Changing existing behavior

---

## Process Note

This CR acknowledges that the project bootstrapped itself without following its own traceability rules. This is acceptable for bootstrap, but the gap should be closed now that the system is operational.

Going forward, all new features MUST have:
1. Design doc (WHAT)
2. ADR if architectural decision involved (HOW)
3. Design chain before implementation chain (unless skipDesign justified)

---

## Affected Files

### New Files

- `docs/design/core/features/agent-workflow.md`
- `docs/design/core/features/design-contract.md`
- `docs/design/core/features/cli-commands.md`
- `docs/design/core/features/eslint-plugin.md`
- `docs/design/core/features/validation-pipeline.md`
- `docs/design/core/features/chain-types.md`
- `docs/adr/done/ADR-004-agent-role-separation.md`
- `docs/adr/done/ADR-005-design-contract-api.md`
- `docs/adr/done/ADR-006-chain-type-system.md`

### Modified Files

- `docs/agents/control-agent.md` (add design doc link)
- `docs/agents/impl-agent.md` (add design doc link)
- `docs/agents/handoff-templates.md` (add design doc link)
- `packages/contracts/src/design-contract.ts` (add ADR link)
- `packages/core/src/tasks/types.ts` (add ADR link)

---

## Linked Design Documents

- docs/design/DEVELOPMENT_PIPELINE.md (defines traceability requirements)

---

## Linked ADRs

- ADR-001-task-file-format
- ADR-002-governance-schema

---

## Commits

No commits yet.

---

## Completion Notes

**Completed**: 2025-12-07

**Design Chain**: CHAIN-020-backfill-traceability-design (3 tasks)
- Created 6 design documents
- Created 3 ADRs
- Verified all artifacts

**Implementation Chain**: CHAIN-021-backfill-traceability-impl (2 tasks)
- Added backlinks to docs/agents/*.md
- Updated source file ADR references
- Added design doc ↔ ADR cross-links

**Artifacts created**:
- `docs/design/core/features/agent-workflow.md`
- `docs/design/core/features/design-contract.md`
- `docs/design/core/features/cli-commands.md`
- `docs/design/core/features/eslint-plugin.md`
- `docs/design/core/features/validation-pipeline.md`
- `docs/design/core/features/chain-types.md`
- `docs/adr/done/ADR-004-agent-role-separation.md`
- `docs/adr/done/ADR-005-design-contract-api.md`
- `docs/adr/done/ADR-006-chain-type-system.md`

**Process note**: First CR to use proper design chain → impl chain pairing with dependsOn linking.
