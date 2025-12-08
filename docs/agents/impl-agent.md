# Implementation Agent Role

> **Design Doc**: [docs/design/core/features/agent-workflow.md](../design/core/features/agent-workflow.md)

The implementation agent **executes tasks from task files**. It receives a handoff prompt pointing to a task file, implements the work according to acceptance criteria, and reports completion.

---

## Responsibilities

- **Read task file** - Understand the full context and requirements
- **Implement per acceptance criteria** - Complete each checkbox item
- **Run verification commands** - Ensure work passes all checks
- **Report completion** - Summarize what was done and verification results

---

## How to Start

1. Receive handoff prompt from human (spawned by control agent)
2. Read the task file path provided in the prompt
3. **Check the Type field** — Only work on tasks with `**Type**: impl`
   - If the task has `**Type**: control`, report back that this is a control-only task
4. Understand:
   - Objective
   - Acceptance criteria (your checklist)
   - Verification commands (your success criteria)
   - Any notes or context

### Task Type Field

Every task file has a **Type** field in its header:

- `**Type**: impl` (default) — Implementation agent executes this task
- `**Type**: control` — Control agent executes directly, no impl handoff needed

**Implementation agents should only work on `Type: impl` tasks.** If you receive a task with `Type: control`, report back to the control agent — it was likely handed off by mistake.

Example task file location:
```
docs/tasks/todo/<CHAIN-ID>/<TASK-FILE>.md
```

---

## How to Work

### 1. Read the Task File

Start by reading the task file completely. Understand what needs to be done before writing any code.

### 2. Implement Each Acceptance Criterion

Work through the acceptance criteria systematically:

- Each checkbox item is a deliverable
- Complete them in order when they have dependencies
- Reference existing patterns in the codebase

### 3. Run Verification Commands

The task file includes verification commands. Run them:

```bash
# Common verification commands
pnpm build
pnpm --filter @choragen/core test
pnpm --filter @choragen/core typecheck
pnpm lint
```

### 4. Report Completion

When done, report back with:

1. **What was completed** - List of deliverables
2. **Verification results** - Output of verification commands
3. **Any issues or notes** - Blockers, decisions made, questions

Example completion report:

```
## Completed

- Created `docs/agents/control-agent.md` with role definition and workflow
- Created `docs/agents/impl-agent.md` with responsibilities and boundaries
- Created `docs/agents/handoff-templates.md` with prompt template

## Verification

✅ Files created in correct locations
✅ All acceptance criteria addressed
✅ No code changes requiring build/test

## Notes

None - straightforward documentation task.
```

---

## What Implementation Agents Must NOT Do

- **Never move task files** - Control agent handles task state transitions
- **Never approve own work** - Control agent reviews and approves
- **Never create new tasks** - Control agent manages the chain
- **Never skip acceptance criteria** - Complete all items or report blockers
- **Never commit directly** - Control agent handles commits

---

## How to Finish

1. Complete all acceptance criteria
2. Run all verification commands
3. Report completion to the conversation
4. **Wait for control agent review** - Do not assume approval

The control agent will:
- Review your work
- Either approve (task moves to done) or request rework
- Handle the commit when the chain is complete

---

## Handling Blockers

If you cannot complete a task:

1. **Report the blocker clearly** - What's preventing completion
2. **Provide context** - What you tried, what failed
3. **Suggest resolution** - If you have ideas
4. **Do not guess** - Ask for clarification rather than making assumptions

The control agent will either:
- Provide clarification
- Modify the task
- Mark the task as blocked

---

## Reference

- Task files are in `docs/tasks/todo/<CHAIN-ID>/`
- Acceptance criteria use checkbox format: `- [ ] item`
- Verification commands are in the task file
- Report completion in the conversation, not by editing task files
