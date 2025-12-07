# Feature: Agent Workflow

**Domain**: core  
**Created**: 2025-12-07  
**Status**: Implemented  

---

## Overview

Choragen uses a two-agent model that separates planning/review (control) from execution (implementation). This separation ensures traceability, review integrity, and reproducibility in agentic development workflows.

---

## Why Separation is Needed

### Context Boundaries

- **Control agents** maintain high-level context across multiple tasks
- **Implementation agents** work with fresh context per task
- Prevents context pollution between planning and execution

### Review Integrity

- Control agents review work they did not implement
- Prevents self-approval of changes
- Ensures independent verification of acceptance criteria

### Reproducibility

- Task files capture complete context for implementation
- Fresh agent sessions produce consistent starting points
- Handoff prompts are standardized and traceable

### Accountability

- Clear ownership: control decides WHAT, impl executes HOW
- Audit trail shows which agent performed which action
- Every change traces back through CR/FR → Chain → Task

---

## Control Agent Responsibilities

The control agent **manages work but does NOT implement**.

| Responsibility | Description |
|----------------|-------------|
| **Create CRs/FRs** | Document new work or bug fixes in `docs/requests/` |
| **Create task chains** | Break down work into sequenced tasks |
| **Populate task files** | Write clear acceptance criteria for each task |
| **Review completed work** | Verify impl agent output meets acceptance criteria |
| **Approve or rework** | Gate quality before merging |
| **Commit and push** | Finalize completed chains with proper commit messages |

### What Control Agents Must NOT Do

- Never implement code directly (even for "quick fixes")
- Never skip the CR/FR (every change needs a request)
- Never approve own implementation
- Never move task files before review

---

## Implementation Agent Responsibilities

The implementation agent **executes tasks from task files**.

| Responsibility | Description |
|----------------|-------------|
| **Read task file** | Understand full context and requirements |
| **Implement per criteria** | Complete each acceptance criterion checkbox |
| **Run verification** | Ensure work passes all specified checks |
| **Report completion** | Summarize what was done and verification results |

### What Implementation Agents Must NOT Do

- Never move task files (control handles state transitions)
- Never approve own work (control reviews and approves)
- Never create new tasks (control manages the chain)
- Never skip acceptance criteria (complete all or report blockers)
- Never commit directly (control handles commits)

---

## Handoff Process

### Standard Handoff Flow

```
1. Control agent creates task file with acceptance criteria
2. Control agent generates handoff prompt
3. Human spawns fresh impl agent session
4. Human pastes handoff prompt
5. Impl agent reads task file and executes
6. Impl agent reports completion
7. Control agent reviews and approves/reworks
```

### Handoff Prompt Template

```
You are an implementation agent working on choragen at {{PROJECT_PATH}}

Your task: {{TASK_FILE_PATH}}

Read that file. Complete the work per acceptance criteria. 
Run verification commands. Report back what you completed. 
Do NOT move task files.
```

### Fresh Session Requirement

Always spawn a fresh agent session for impl work:

- **Clean context** - No confusion from previous conversation
- **Clear boundaries** - Impl agent only sees the task
- **Reproducibility** - Same prompt produces same starting point
- **Accountability** - Each session is traceable to one task

---

## Control-Only Tasks

Some tasks require no implementation handoff:

- **Verification tasks** - "verify and close CR"
- **Review tasks** - "review implementation"
- **Closure tasks** - "move CR to done"
- **Commit tasks** - "commit chain completion"

Mark these with `**Type**: control` in the task header.

---

## Acceptance Criteria

- [ ] Two-agent model separates planning from execution
- [ ] Control agents manage work lifecycle (CR → Chain → Task → Review)
- [ ] Implementation agents execute per task file acceptance criteria
- [ ] Handoff process uses standardized prompt template
- [ ] Fresh agent sessions ensure clean context per task
- [ ] Control-only tasks are marked and handled appropriately

---

## Linked Scenarios

- [Control Agent Workflow](../scenarios/control-agent-workflow.md)
- [Implementation Agent Workflow](../scenarios/implementation-agent-workflow.md)

---

## Linked ADRs

- [ADR-004: Agent Role Separation](../../adr/done/ADR-004-agent-role-separation.md)

---

## Implementation

- `docs/agents/control-agent.md`
- `docs/agents/impl-agent.md`
- `docs/agents/handoff-templates.md`
