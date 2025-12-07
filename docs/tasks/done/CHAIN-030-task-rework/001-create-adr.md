# Task: Create ADR for Rework Model

**ID**: 001-create-adr  
**Chain**: CHAIN-030-task-rework  
**Status**: in-progress  
**Agent**: impl  

---

## Objective

Create an Architecture Decision Record documenting the rework task model decisions.

## Key Decisions to Document

1. **New task vs. mutate existing**: Why we create a new task for rework
2. **Task ID format**: `{original-id}-rework-{n}` pattern
3. **Fields added**: `reworkOf`, `reworkReason`, `reworkCount`
4. **Status flow**: How rework tasks move through statuses
5. **Metrics implications**: How rework enables quality metrics

## Deliverable

Create `docs/adr/doing/ADR-008-task-rework-model.md` with:

- Context (why rework tracking matters)
- Decision (new task approach)
- Consequences (traceability, metrics, complexity)
- Alternatives considered (mutate existing, separate rework log)

## Acceptance Criteria

- [ ] ADR created in `docs/adr/doing/`
- [ ] Links to CR-20251207-010
- [ ] Documents all key decisions above
- [ ] Follows ADR template format
