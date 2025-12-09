# Task: Implement Session Browser (List/Resume)

**Chain**: CHAIN-041-interactive-menu  
**Task**: 004-session-browser  
**Status**: todo  
**Type**: impl  
**Created**: 2025-12-08

---

## Objective

Implement the "Resume Session" and "List Sessions" menu options with an interactive session browser.

---

## Context

Users need to easily browse, filter, and resume paused sessions. This task creates an interactive browser that replaces the `agent:list-sessions` and `agent:resume` CLI commands.

---

## Expected Files

- `packages/cli/src/menu/session-browser.ts` (browser implementation)
- `packages/cli/src/menu/session-list.ts` (list view)
- `packages/cli/src/__tests__/menu/session-browser.test.ts`

---

## Acceptance Criteria

- [ ] "Resume Session" shows only paused/failed sessions
- [ ] "List Sessions" shows all sessions with status filtering
- [ ] Sessions displayed in a table format with: ID, Role, Status, Started, Tokens
- [ ] Arrow keys to navigate session list
- [ ] Enter to select a session for details/resume
- [ ] Session detail view shows full info and resume option
- [ ] Filter by status (running, paused, completed, failed)
- [ ] Back option returns to main menu
- [ ] Handles empty session list gracefully
- [ ] Unit tests for browser logic
- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes

---

## Constraints

- Reuse `Session.listAll()` and `Session.load()` from runtime
- Session list should be paginated if >20 sessions
- Resuming a session should work the same as `agent:resume`

---

## Notes

The session browser should show helpful context:
- For paused sessions: "Paused at turn 5, 12,345 tokens used"
- For failed sessions: "Failed: rate limit exceeded (recoverable)"

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
