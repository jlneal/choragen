# Scenario: Control Agent Workflow

**Domain**: core  
**Created**: 2025-12-05  

---

## User Story

As a **control agent**, I want to break down a change request into manageable tasks and coordinate their execution, so that work can be completed reliably even across context boundaries.

---

## Flow

1. **Receive CR/FR**: Control agent receives a change request or fix request
2. **Create Chain**: `choragen chain:new CR-xxx feature-name`
3. **Plan Tasks**: Break work into context-window-sized chunks
4. **Add Tasks**: `choragen task:add CHAIN-xxx task-slug "Task title"`
5. **Acquire Locks**: `choragen lock:acquire CHAIN-xxx "pattern/**"`
6. **Ready First Task**: `choragen task:ready CHAIN-xxx 001-first-task`
7. **Delegate**: Hand off task context to implementation agent
8. **Review**: When implementation agent completes, review the work
9. **Approve/Rework**: `choragen task:approve` or `choragen task:rework`
10. **Repeat**: Continue until all tasks complete
11. **Release Locks**: `choragen lock:release CHAIN-xxx`

---

## Context Preservation

The control agent's context is preserved in:
- Chain metadata (`.choragen/chains/CHAIN-xxx.json`)
- Task files (markdown with full instructions)
- Git history (all changes tracked)

If the control agent loses context, it can resume:
```bash
choragen chain:status CHAIN-xxx
choragen task:next CHAIN-xxx
```

---

## Acceptance Criteria

- [ ] Control agent can create chains from CRs
- [ ] Tasks can be added with full context
- [ ] Locks prevent parallel chain conflicts
- [ ] Work can resume after context loss
- [ ] Progress is visible via chain:status

---

## Linked Personas

- [AI Agent](../personas/ai-agent.md) (as Control Agent)
- [Solo Developer](../personas/solo-developer.md)
- [Team Lead](../personas/team-lead.md)
- [Open Source Maintainer](../personas/open-source-maintainer.md)

---

## Linked Use Cases

- [Create and Execute Task Chain](../use-cases/create-execute-task-chain.md)
- [Review and Approve Work](../use-cases/review-approve-work.md)

---

## Linked Features

- [Task Chain Management](../features/task-chain-management.md)
- [File Locking](../features/file-locking.md)
