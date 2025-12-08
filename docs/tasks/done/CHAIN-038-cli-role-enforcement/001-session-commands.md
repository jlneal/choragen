# Task: Add session:start and session:status commands

**Chain**: CHAIN-038-cli-role-enforcement  
**Task**: 001-session-commands  
**Status**: backlog  
**Type**: impl  
**Created**: 2025-12-08

---

## Objective

Add CLI commands for managing agent session state. Sessions track the current agent role and optionally the task being worked on.

---

## Expected Files

Create:
- `packages/cli/src/commands/session.ts` — Session command implementations

Update:
- `packages/cli/src/cli.ts` — Register session:start, session:status, session:end commands

---

## Acceptance Criteria

- [ ] `choragen session:start impl` creates `.choragen/session.json` with role=impl
- [ ] `choragen session:start control` creates `.choragen/session.json` with role=control
- [ ] `choragen session:start impl --task <path>` includes task path in session
- [ ] `choragen session:status` displays current role, task, and start time
- [ ] `choragen session:status` shows "No active session" if no session file
- [ ] `choragen session:end` removes the session file
- [ ] Session file is gitignored (add to `.gitignore` if not already)

---

## Notes

Session file structure (`.choragen/session.json`):

```json
{
  "role": "impl",
  "task": "docs/tasks/in-progress/CHAIN-038/001-session-commands.md",
  "started": "2025-12-08T02:00:00Z"
}
```

Commands to add to `cli.ts`:

```typescript
"session:start": {
  description: "Start a session with a role",
  usage: "session:start <impl|control> [--task <path>]",
  handler: async (args) => { ... }
},
"session:status": {
  description: "Show current session status",
  handler: async () => { ... }
},
"session:end": {
  description: "End the current session",
  handler: async () => { ... }
}
```

**Verification**:
```bash
pnpm build
node packages/cli/dist/bin.js session:start impl
node packages/cli/dist/bin.js session:status
cat .choragen/session.json
node packages/cli/dist/bin.js session:end
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
