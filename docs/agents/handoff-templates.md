# Handoff Templates

> **Design Doc**: [docs/design/core/features/agent-workflow.md](../design/core/features/agent-workflow.md)

Templates for handing off tasks from control agents to implementation agents.

---

## Standard Implementation Agent Handoff

Use this template when spawning a new impl agent session for a task.

### Template

```
You are an implementation agent working on choragen at {{PROJECT_PATH}}

Your task: {{TASK_FILE_PATH}}

Read that file. Complete the work per acceptance criteria. Run verification commands. Report back what you completed. Do NOT move task files.
```

### Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{PROJECT_PATH}}` | Absolute path to project root | `/Users/justin/Projects/choragen` |
| `{{TASK_FILE_PATH}}` | Relative path to task file | `docs/tasks/todo/CHAIN-019-role-separation/001-create-agent-docs.md` |

---

## Example: Filled-In Prompt

```
You are an implementation agent working on choragen at /Users/justin/Projects/choragen

Your task: docs/tasks/todo/CHAIN-019-role-separation/001-create-agent-docs.md

Read that file. Complete the work per acceptance criteria. Run verification commands. Report back what you completed. Do NOT move task files.
```

---

## Fresh Session Requirement

**Always spawn a fresh agent session for impl work.**

Why:
- **Clean context** - No confusion from previous conversation
- **Clear boundaries** - Impl agent only sees the task
- **Reproducibility** - Same prompt produces same starting point
- **Accountability** - Each session is traceable to one task

How:
1. Control agent generates the handoff prompt
2. Human opens a new agent session (new chat/conversation)
3. Human pastes the prompt
4. Impl agent reads task file and begins work

---

## Handoff Checklist

Before handing off to impl agent:

- [ ] Task file exists and is complete
- [ ] Acceptance criteria are clear and testable
- [ ] Verification commands are specified
- [ ] Any dependencies are resolved
- [ ] Fresh agent session is ready

---

## After Handoff

1. **Wait for impl agent to report completion**
2. **Review the work** - Check acceptance criteria
3. **Verify** - Run verification commands if needed
4. **Decide**:
   - Approve: Move task to done, proceed
   - Rework: Provide feedback, impl continues

---

## Multi-Task Chains

For chains with multiple tasks:

1. Hand off tasks **one at a time**
2. Wait for completion and approval before next handoff
3. Each task gets a **fresh impl agent session**
4. Control agent maintains chain state between handoffs

This ensures:
- Sequential dependencies are respected
- Each task is reviewed before the next begins
- Clear audit trail of who did what
