# Change Request: Ideation Workflow

**ID**: CR-20251212-003  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-12  
**Owner**: agent  

---

## What

Implement a dedicated Ideation Workflow for exploring and refining ideas before committing to formal requests. This workflow:

- Provides structured exploration with an Ideation Agent
- Supports three stages: exploration, proposal, creation
- Requires human approval before drafting requests
- Outputs to backlog (not todo) — commitment is separate
- Supports discarding ideas with documented reasoning

---

## Why

Currently, there's no formal process for idea exploration:

1. **Premature commitment** — Ideas jump straight to request creation
2. **Lost context** — Exploratory conversations aren't captured
3. **No discard path** — No structured way to reject ideas
4. **Backlog confusion** — No distinction between explored and raw ideas

A dedicated ideation workflow enables thorough exploration before commitment.

---

## Scope

**In Scope**:
- Ideation workflow template with three stages
- Exploration stage with discard option
- Proposal stage for human approval before drafting
- Creation stage outputting to backlog
- Discard handling with documented reasoning
- Support for multiple requests from single ideation session
- Add "discarded" to workflow status enum (distinct from "cancelled" — discarded means idea was explored and rejected; cancelled means workflow was stopped mid-execution)

**Out of Scope**:
- Idea archival/resumption
- Priority algorithm
- Batch ideation (multiple ideas per session)

---

## Affected Design Documents

- docs/design/core/features/ideation-workflow.md
- docs/design/core/features/specialized-agent-roles.md (Ideation role)

---

## Linked ADRs

- ADR-TBD: Ideation Workflow Design

---

## Commits

No commits yet.

---

## Implementation Notes

Key implementation areas:
1. Create `ideation.yaml` workflow template
2. Implement discard workflow state and handling (add "discarded" to WorkflowStatus type)
3. Add `request:create` tool for Ideation agent
4. Create backlog directory structure for requests
5. Update workflow UI to support discard option in gates

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
