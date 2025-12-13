# Task: Integration Tests

**Chain**: CHAIN-068-agent-tools  
**Task**: T008-integration-tests  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Create integration tests that verify the new tools work correctly within workflow execution.

---

## Context

Unit tests verify individual tool behavior, but integration tests are needed to verify:
- Tools work correctly when called by agents
- State transitions happen as expected
- Events are emitted and received by orchestration
- Role-based access is enforced

---

## Expected Files

- `packages/cli/src/runtime/__tests__/tool-integration.test.ts`

---

## Acceptance Criteria

- [ ] Integration test for task lifecycle: submit → review → approve/request_changes
- [ ] Integration test for chain lifecycle: all tasks done → chain review
- [ ] Integration test for request lifecycle: create → approve
- [ ] Integration test for feedback: create blocking and non-blocking
- [ ] Integration test for spawn_agent: spawn different roles
- [ ] Integration test for git tools: status → diff → commit flow
- [ ] Tests verify role-based access (tool rejected for wrong role)
- [ ] Tests verify event emission

---

## Constraints

- Tests should not require actual git repository (mock git operations)
- Tests should not require actual LLM calls (mock agent responses)

---

## Notes

Consider using test fixtures for workflow state. May need to set up mock event bus for event verification.

---

## Completion Summary

Added comprehensive integration test coverage:

- Created `packages/cli/src/runtime/__tests__/tool-integration.test.ts`
- Task lifecycle: submit → approve and submit → request_changes → resubmit flows
- Chain lifecycle: approve after all tasks done, request_changes
- Request lifecycle: create → approve flow with template setup
- Feedback: blocking (pauses workflow) and non-blocking modes
- Spawn agent: allowed role spawning and privilege escalation rejection
- Git tools: status → diff → commit flow with temp repo
- Role-based access: governance gate denies unauthorized tools
- Event emission: captured events verified for all lifecycle tools
