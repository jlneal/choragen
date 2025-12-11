# Task: CLI Workflow Commands

**Chain**: CHAIN-059-workflow-orchestration  
**Task**: T005  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Implement CLI commands for workflow management.

---

## Context

Users need CLI commands to create, monitor, and advance workflows. These commands wrap the WorkflowManager API.

---

## Expected Files

- `packages/cli/src/commands/workflow.ts`
- `packages/cli/src/commands/index.ts` (update exports)

---

## Acceptance Criteria

- [x] `choragen workflow:start <request-id> [--template=standard]` creates and starts workflow
- [x] `choragen workflow:status <workflow-id>` shows current stage, progress, gate status
- [x] `choragen workflow:list [--status=active]` lists workflows with optional status filter
- [x] `choragen workflow:advance <workflow-id>` advances to next stage (if gate satisfied)
- [x] `choragen workflow:approve <workflow-id>` satisfies human_approval gate on current stage
- [x] Commands provide clear error messages for invalid operations
- [x] Commands use consistent output formatting with other CLI commands
- [x] Integration tests for all commands

---

## Constraints

- Follow existing command patterns in `packages/cli/src/commands/`
- Use Commander.js consistent with other commands
- Validate request-id exists before creating workflow

---

## Notes

Status output should show:
- Workflow ID and request ID
- Current stage name and type
- Stage progress (e.g., "Stage 3 of 5")
- Gate status (satisfied/pending)
- Recent messages (last 3-5)

---

## Completion Notes

**Completed**: 2025-12-10

Files created:
- `packages/cli/src/commands/workflow.ts` — CLI helpers for start/list/status/advance/approve with request validation and formatting
- `packages/cli/src/commands/index.ts` — Command exports
- `packages/cli/src/__tests__/workflow-commands.test.ts` — Integration tests for all commands

Files updated:
- `packages/cli/src/cli.ts` — Wired workflow commands into CLI dispatcher

Features:
- Request validation before workflow creation
- Formatted status/list output
- Status filtering support
- Gate approval handling
- Clear error messages for invalid operations
