# Task: Create ADR for Metrics Model

**ID**: 001-create-adr  
**Chain**: CHAIN-031-pipeline-metrics  
**Status**: todo  
**Agent**: impl  

---

## Objective

Create an Architecture Decision Record documenting the metrics system design.

## Key Decisions to Document

1. **Event-sourced model**: Why append-only event log vs. mutable state
2. **Storage format**: JSONL for events, JSON for aggregates
3. **Event types**: task:started, task:completed, task:rework, chain:created, etc.
4. **Identity tracking**: Model name as agent identity
5. **Token tracking**: Manual now, automated later
6. **Historical import**: Git-based reconstruction

## Deliverable

Create `docs/adr/doing/ADR-009-pipeline-metrics.md` with:

- Context (why metrics matter)
- Decision (event-sourced, local-first)
- Event schema
- Aggregation strategy
- Consequences

## Acceptance Criteria

- [ ] ADR created in `docs/adr/doing/`
- [ ] Links to CR-20251207-011
- [ ] Documents event schema
- [ ] Explains storage format choice
- [ ] Follows ADR template format
