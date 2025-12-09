# Task: Integration Tests for Interactive Menu

**Chain**: CHAIN-041-interactive-menu  
**Task**: 006-integration-tests  
**Status**: todo  
**Type**: impl  
**Created**: 2025-12-08

---

## Objective

Create comprehensive integration tests for the interactive menu system.

---

## Context

All menu components are implemented. This task ensures they work together correctly and handles edge cases.

---

## Expected Files

- `packages/cli/src/__tests__/menu/integration.test.ts`
- `packages/cli/src/__tests__/menu/fixtures/` (test fixtures)

---

## Acceptance Criteria

- [ ] Test: Menu launches when `choragen agent` called with no args
- [ ] Test: Full wizard flow from menu → start session → running
- [ ] Test: Resume session flow from menu → browser → resume
- [ ] Test: Settings persistence across menu restarts
- [ ] Test: Cleanup flow with confirmation
- [ ] Test: Graceful handling of missing API keys
- [ ] Test: Graceful handling of no sessions
- [ ] Test: Keyboard interrupt (Ctrl+C) handling
- [ ] Test: Invalid input handling at each step
- [ ] All existing agent runtime tests still pass (615 tests)
- [ ] `pnpm build` passes
- [ ] `pnpm --filter @choragen/cli test` passes
- [ ] `pnpm lint` passes

---

## Constraints

- Tests should mock TTY interactions (use clack's testing utilities if available)
- Tests should not require actual API keys
- Tests should be deterministic (no timing-dependent assertions)

---

## Notes

Consider using snapshot testing for menu output formatting. The integration tests should cover the happy path and common error scenarios.

After this task, the CR acceptance criteria should be fully met:
- Menu Launcher ✓
- Main Menu Options ✓
- Start Session Wizard ✓
- Session Monitor (handled by existing runtime) ✓
- Settings Persistence ✓

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
