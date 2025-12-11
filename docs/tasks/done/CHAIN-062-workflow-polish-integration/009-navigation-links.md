# Task: Add workflow links to sessions and chains pages

**Chain**: CHAIN-062-workflow-polish-integration  
**Task**: 009-navigation-links  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Add navigation links between workflows and related entities (sessions, chains) for better discoverability.

---

## Expected Files

- `packages/web/src/components/sessions/session-card.tsx — Add workflow link`
- `packages/web/src/components/chains/chain-card.tsx — Add workflow link`
- `packages/web/src/__tests__/components/navigation-links.test.tsx — Tests`

---

## Acceptance Criteria

- [ ] Sessions page shows link to associated workflow (if any)
- [ ] Chain cards show link to associated workflow (if any)
- [ ] Links navigate to /chat/[workflowId]
- [ ] Links only appear when workflow association exists
- [ ] Visual indicator (icon) shows workflow linkage

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
