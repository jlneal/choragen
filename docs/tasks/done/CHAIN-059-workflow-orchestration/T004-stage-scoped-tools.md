# Task: Stage-Scoped Tool Filtering

**Chain**: CHAIN-059-workflow-orchestration  
**Task**: T004  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Extend `ToolRegistry` to filter tools by stage type in addition to role.

---

## Context

Currently tools are filtered by agent role (control vs impl). Workflow orchestration adds stage-based filtering so agents only see tools appropriate for the current workflow stage.

---

## Expected Files

- `packages/cli/src/runtime/tools/registry.ts` (modify)
- `packages/core/src/workflow/stage-tools.ts` (new - defines tool availability matrix)

---

## Acceptance Criteria

- [x] `ToolRegistry.getToolsForStage(role, stageType)` returns stage-appropriate tools
- [x] Stage tool matrix defined per design doc table
- [x] `request` stage: request creation tools only
- [x] `design` stage: chain/task creation, doc writing tools
- [x] `implementation` stage: code editing, command running, spawn_impl tools
- [x] `verification` stage: command running, gate satisfaction tools
- [x] `review` stage: approval, gate satisfaction tools
- [x] Existing role filtering still applies (stage filtering is additive)
- [x] Unit tests for stage-scoped filtering

---

## Constraints

- Must not break existing role-based filtering
- Stage filtering is optional (null stage = no stage filtering)

---

## Notes

Tool availability matrix from design doc:

| Tool | request | design | review | impl | verify |
|------|---------|--------|--------|------|--------|
| `request:create` | ✓ | ✗ | ✗ | ✗ | ✗ |
| `chain:new` | ✗ | ✓ | ✗ | ✗ | ✗ |
| `write_file` (src) | ✗ | ✗ | ✗ | ✓ | ✗ |
| `run_command` | ✗ | ✗ | ✗ | ✓ | ✓ |

---

## Completion Notes

**Completed**: 2025-12-10

Files created:
- `packages/core/src/workflow/stage-tools.ts` — Stage tool matrix and helpers

Files updated:
- `packages/core/src/workflow/index.ts` — Export stage-tools module
- `packages/cli/src/runtime/tools/registry.ts` — Added `getToolsForStage()` and `getProviderToolsForStage()` methods

Tests added:
- CLI tests for stage filtering behavior

Features:
- Stage filtering layers on top of existing role filtering
- Null stage = no stage filtering (backward compatible)
- Built-in stage matrix per design doc
