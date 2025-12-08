# Change Request: CLI Role Enforcement

**ID**: CR-20251207-021  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-07  
**Owner**: control-agent  

---

## What

Add CLI commands and runtime enforcement for role-based governance. This includes session role declaration, role-aware governance checks, and preparation for the custom CLI shell interface.

---

## Why

Documentation-based role boundaries rely on agent compliance. Deterministic enforcement requires programmatic validation—the CLI should reject operations that violate role boundaries before they happen.

This is the enforcement layer that makes role separation reliable rather than advisory.

---

## Scope

**In Scope**:
- `choragen session:start <role>` — Declare session role, write to `.choragen/session.json`
- `choragen session:status` — Show current session role and context
- `choragen governance:check --role <role> <action> <file>` — Validate action against role rules
- Role validation in existing commands (e.g., `task:start` checks role matches task type)
- Session context file (`.choragen/session.json`)

**Out of Scope**:
- Full CLI shell interface (future phase)
- Git hook integration for role enforcement
- Multi-agent coordination

---

## Affected Design Documents

- [docs/design/core/features/agent-workflow.md](../../design/core/features/agent-workflow.md)
- [docs/design/core/features/cli-commands.md](../../design/core/features/cli-commands.md)

---

## Linked ADRs

- [ADR-004: Agent Role Separation](../../adr/done/ADR-004-agent-role-separation.md)

---

## Acceptance Criteria

- [x] `choragen session:start impl` creates `.choragen/session.json` with role
- [x] `choragen session:start control` creates `.choragen/session.json` with role
- [x] `choragen session:status` displays current role or "no active session"
- [x] `choragen governance:check --role impl modify packages/core/src/foo.ts` returns allowed
- [x] `choragen governance:check --role impl move docs/tasks/todo/x.md` returns denied
- [x] `choragen governance:check --role control modify packages/core/src/foo.ts` returns denied
- [x] Session file includes: role, task (if any), started timestamp
- [x] Commands respect session role when validating operations

---

## Commits

No commits yet.

---

## Implementation Notes

Session file structure:

```json
// .choragen/session.json
{
  "role": "impl",
  "task": "docs/tasks/in-progress/CHAIN-019/001-foo.md",
  "started": "2025-12-07T20:30:00Z"
}
```

This file is:
- Created by `session:start`
- Read by governance checks
- Cleared by `session:end` or on task completion
- Gitignored (session state is local)

Future: The custom CLI shell will automatically manage session state, making explicit `session:start` unnecessary for shell users.

---

## Completion Notes

Implemented CLI role enforcement via CHAIN-038-cli-role-enforcement:

**Session commands** (`packages/cli/src/commands/session.ts`):
- `session:start <impl|control> [--task <path>]` — Creates `.choragen/session.json`
- `session:status` — Displays current role, task, and start time
- `session:end` — Removes session file
- Session file is gitignored

**Governance enhancement** (`packages/cli/src/cli.ts`):
- Added `--role <impl|control>` flag to `governance:check` command
- Uses `checkMutationForRole()` from `@choragen/core` for role-based validation
- Backward compatible: without `--role`, uses existing global rules
- Added `move` action support for task file governance

**Result**: Agents can now declare their role and validate file mutations against role-specific governance rules.
