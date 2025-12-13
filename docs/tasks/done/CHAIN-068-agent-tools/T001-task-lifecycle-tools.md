# Task: Task Lifecycle Tools

**Chain**: CHAIN-068-agent-tools  
**Task**: T001-task-lifecycle-tools  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Implement the task lifecycle tools: `task:submit` and `task:request_changes`. The existing `task:approve` tool is already implemented.

---

## Context

The Standard Workflow requires agents to submit tasks for review and reviewers to request changes. Per ADR-013:
- `task:submit` moves task from in-progress → in-review, emits `task.submitted` event
- `task:request_changes` moves task from in-review → in-progress, emits `task.changes_requested` event

These tools integrate with the existing TaskManager and event system.

---

## Expected Files

- `packages/cli/src/runtime/tools/task-tools.ts` (modify existing or create)
- `packages/cli/src/runtime/tools/__tests__/task-tools.test.ts`

---

## Acceptance Criteria

- [ ] `task:submit` tool implemented with parameters: `{ chainId, taskId, summary? }`
- [ ] `task:submit` moves task file from in-progress to in-review
- [ ] `task:submit` emits `task.submitted` event
- [ ] `task:request_changes` tool implemented with parameters: `{ chainId, taskId, reason, suggestions? }`
- [ ] `task:request_changes` moves task file from in-review to in-progress
- [ ] `task:request_changes` emits `task.changes_requested` event
- [ ] Both tools registered in ToolRegistry
- [ ] Unit tests for both tools

---

## Constraints

- Must integrate with existing TaskManager if one exists
- Must follow tool naming convention from ADR-013
- Events must be compatible with workflow orchestration

---

## Notes

Check existing `task:complete` implementation for patterns. The `task:submit` may be similar or identical to `task:complete` depending on current implementation.

---

## Completion Summary

Implemented task submission and change request tools with event emission and runtime wiring:

- Added `task:submit` and `task:request_changes` executors in `packages/cli/src/runtime/tools/task-tools.ts`
- Handles status transitions via TaskManager with optional summaries/reasons/suggestions
- Emits `task.submitted` and `task.changes_requested` events through ExecutionContext emitter
- Wired into exports, registry, and executor maps
- Enabled stage access in `packages/core/src/workflow/stage-tools.ts`
- Agent loop forwards lifecycle events via `AgentSessionEvents.onEvent`
- Added unit tests in `packages/cli/src/runtime/tools/__tests__/task-tools.test.ts`
