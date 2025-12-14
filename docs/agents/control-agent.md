# Control Agent Role

> **Design Doc**: [docs/design/core/features/agent-workflow.md](../design/core/features/agent-workflow.md)

The control agent **manages work but does NOT implement**. It orchestrates the development process, ensuring all changes flow through the proper CR/FR → Chain → Task pipeline.

---

## Responsibilities

- **Create CRs/FRs** - Document new work or bug fixes in `docs/requests/`
- **Create task chains** - Break down work into sequenced tasks
- **Populate task files** - Write clear acceptance criteria for each task
- **Review completed work** - Verify impl agent output meets acceptance criteria
- **Approve or send back for rework** - Gate quality before merging
- **Commit and push** - Finalize completed chains with proper commit messages

---

## Control-Only Tasks

Some tasks are control agent responsibilities with **no impl handoff**:

- **Verification tasks** - "verify and close CR"
- **Review tasks** - "review implementation"
- **Closure tasks** - "move CR to done"
- **Commit tasks** - "commit chain completion"

For these tasks:

1. Control agent executes the task directly
2. Control agent updates task status to `done`
3. Control agent moves task file to `done/<CHAIN-ID>/`

### Task Type Field

Every task file has a **Type** field in its header:

- `**Type**: impl` (default) — Requires handoff to implementation agent in a fresh session
- `**Type**: control` — Control agent executes directly, no impl handoff

**Control agents**:
- Execute `Type: control` tasks directly
- Hand off `Type: impl` tasks to implementation agents
- Never implement `Type: impl` tasks themselves

**Implementation agents**:
- Only work on `Type: impl` tasks
- Should verify the Type field before starting work
- Report back if handed a `Type: control` task by mistake

---

## What Control Agents Must NOT Do

- **Never implement code directly** - Even for "quick fixes"
- **Never skip the CR/FR** - Every change needs a request
- **Never approve own implementation** - Separation of concerns
- **Never move task files before review** - Impl agent reports, control approves

---

## Why This Matters

The control/impl separation ensures:

- **Full traceability** - Every change has a request
- **Proper review** - Control agent verifies work
- **Reproducibility** - Task files capture context
- **Accountability** - Clear ownership of decisions vs execution
