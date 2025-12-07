# Task: Add backlinks to existing code and docs

**Chain**: CHAIN-021-backfill-traceability-impl  
**Task**: 001-add-backlinks  
**Status**: todo  
**Created**: 2025-12-07

---

## Objective

Add backward links from existing implementation files to their governing design docs and ADRs.

---

## Expected Files

- `Modify existing files (no new files).`

---

## Acceptance Criteria

- [ ] ### docs/agents/*.md backlinks
- [ ] docs/agents/control-agent.md — Add link to docs/design/core/features/agent-workflow.md
- [ ] docs/agents/impl-agent.md — Add link to docs/design/core/features/agent-workflow.md
- [ ] docs/agents/handoff-templates.md — Add link to docs/design/core/features/agent-workflow.md
- [ ] ### Source file ADR references (if missing)
- [ ] Check and add @adr references if not present:
- [ ] packages/contracts/src/design-contract.ts — Should reference ADR-005
- [ ] packages/core/src/tasks/types.ts (Chain type) — Should reference ADR-006
- [ ] ### Design doc cross-links
- [ ] docs/design/core/features/agent-workflow.md — Add link to ADR-004
- [ ] docs/design/core/features/design-contract.md — Add link to ADR-005
- [ ] docs/design/core/features/chain-types.md — Add link to ADR-006

---

## Notes

The backlinks complete the traceability chain:
- Design doc ↔ ADR (bidirectional)
- Implementation → Design doc (forward reference)
- Implementation → ADR (via @adr comment)
