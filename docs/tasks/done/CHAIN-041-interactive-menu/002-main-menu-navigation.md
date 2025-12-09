# Task: Implement Main Menu with Navigation

**Chain**: CHAIN-041-interactive-menu  
**Task**: 002-main-menu-navigation  
**Status**: todo  
**Type**: impl  
**Created**: 2025-12-08

---

## Objective

Implement the main menu with arrow key navigation, selection handling, and proper exit behavior.

---

## Context

Task 001 created the menu scaffold. This task implements the interactive behavior using `@clack/prompts` select functionality.

---

## Expected Files

- `packages/cli/src/menu/main-menu.ts` (implement navigation)
- `packages/cli/src/menu/utils.ts` (helper functions)
- `packages/cli/src/cli.ts` (wire up `agent` command with no args)
- `packages/cli/src/__tests__/menu/main-menu.test.ts` (expand tests)

---

## Acceptance Criteria

- [ ] `choragen agent` (no subcommand) launches interactive menu
- [ ] Arrow key navigation works with Enter to select
- [ ] Escape or 'q' exits the menu cleanly
- [ ] Color-coded output using clack's styling
- [ ] Menu shows dynamic info (e.g., "Resume Session (2 paused)" if sessions exist)
- [ ] Exit option returns to shell cleanly
- [ ] Menu loops back after completing an action (except Exit)
- [ ] Unit tests for menu navigation logic
- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes

---

## Constraints

- Must integrate with existing CLI command structure
- Should not break existing `agent:start`, `agent:resume`, etc. commands
- Handle Ctrl+C gracefully (same as Escape)

---

## Notes

The menu should count paused sessions to display in the "Resume Session" option. Use `Session.listAll()` from the runtime to get session counts.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
