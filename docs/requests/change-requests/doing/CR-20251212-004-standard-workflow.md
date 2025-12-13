# Change Request: Standard Workflow

**ID**: CR-20251212-004  
**Domain**: core  
**Status**: doing  
**Created**: 2025-12-12  
**Owner**: agent  

---

## What

Implement the revised Standard Workflow for executing committed requests. This workflow provides:

- 8-stage process: planning, design, impl-planning, implementation, verification, commit, request-review, completion
- Three-tier review: task, chain, and request level
- Event-driven orchestration (not polling)
- File scopes on tasks and chains for safe parallelism
- Hooks for deterministic actions (file moves, status updates, agent spawning)

---

## Why

The current workflow lacks:

1. **Review structure** — No formal review before marking work complete
2. **Parallel execution** — No file scopes to enable safe concurrency
3. **Event-driven orchestration** — Relies on polling or manual coordination
4. **Deterministic scaffolding** — Agents handle rote actions that should be hooks

The revised workflow treats agents as workers on an assembly line, with the system handling bookkeeping.

---

## Scope

**In Scope**:
- Standard workflow template with 8 stages
- Three-tier review (task, chain, request)
- Event-driven orchestration via hooks
- File scopes on tasks and chains
- Task lifecycle: in-progress → in-review → done
- Chain review after all tasks complete
- Request review after all chains complete
- Parallel chain execution with non-overlapping scopes

**Out of Scope**:
- Retry limits for task changes
- Partial rollback semantics
- Automatic scope conflict detection

---

## Affected Design Documents

- docs/design/core/features/standard-workflow.md
- docs/design/core/features/specialized-agent-roles.md
- docs/design/core/features/workflow-orchestration.md

---

## Linked ADRs

- ADR-010: Agent Runtime Architecture
- ADR-TBD: Standard Workflow Design

---

## Commits

No commits yet.

---

## Implementation Notes

Key implementation areas:
1. Update `standard.yaml` workflow template with 8 stages
2. Implement `task:submit` tool for submitting work for review
3. Implement `task:approve` and `task:request_changes` tools
4. Implement `chain:approve` and `chain:request_changes` tools
5. Implement `request:approve` and `request:request_changes` tools
6. Add file scope to task and chain data models
7. Implement event-driven orchestration hooks
8. Update task lifecycle to include `in-review` state
9. Implement parallel chain spawning with scope validation

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
