# Task: Workflow Manager

**Chain**: CHAIN-059-workflow-orchestration  
**Task**: T002  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Implement `WorkflowManager` for CRUD operations on workflows.

---

## Context

The WorkflowManager handles creating, reading, updating, and persisting workflows. It enforces gate satisfaction before stage advancement.

---

## Expected Files

- `packages/core/src/workflow/manager.ts`
- `packages/core/src/workflow/persistence.ts`
- `packages/core/src/workflow/index.ts` (update exports)

---

## Acceptance Criteria

- [x] `WorkflowManager.create(requestId, template)` creates workflow from template
- [x] `WorkflowManager.get(workflowId)` retrieves workflow by ID
- [x] `WorkflowManager.list(options?)` lists workflows with optional filters
- [x] `WorkflowManager.advance(workflowId)` checks gate satisfaction before advancing
- [x] `WorkflowManager.satisfyGate(workflowId, stageIndex, satisfiedBy)` marks gate as satisfied
- [x] `WorkflowManager.addMessage(workflowId, message)` appends to message history
- [x] `WorkflowManager.updateStatus(workflowId, status)` updates workflow status
- [x] Workflows persist to `.choragen/workflows/*.json`
- [x] Workflow index maintained at `.choragen/workflow-index.json`
- [x] Unit tests for all manager methods

---

## Constraints

- Manager should be usable from both CLI and web contexts
- Use async/await for all file operations
- Follow existing patterns in `packages/core/src/tasks/`

---

## Notes

Gate satisfaction logic varies by gate type:
- `auto`: Always satisfied immediately
- `human_approval`: Requires explicit call to satisfyGate
- `chain_complete`: Check if linked chain is complete
- `verification_pass`: Run commands and check exit codes

---

## Completion Notes

**Completed**: 2025-12-10

Files created:
- `packages/core/src/workflow/persistence.ts` — Workflow persistence helpers with ISO date revival and index tracking
- `packages/core/src/workflow/manager.ts` — WorkflowManager with full CRUD, gate handling, pluggable chain-status checker and command runner
- `packages/core/src/workflow/__tests__/manager.test.ts` — Unit tests for all manager behaviors

File updated:
- `packages/core/src/workflow/index.ts` — Exported manager and persistence

Features:
- Gate handling for all types (auto, human_approval, chain_complete, verification_pass)
- Pluggable dependencies for chain status and command execution
- Workflow ID generation
- Full test coverage
