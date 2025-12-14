# Feature: Task Chain Management

**Domain**: core  
**Created**: 2025-12-05  
**Status**: Implemented  

---

## Overview

Task chains break large work items into context-window-sized chunks that can be executed by agents with fresh context.

---

## Capabilities

### Chain Lifecycle

| Command | Description |
|---------|-------------|
| `chain:new <cr-id> <slug>` | Create a new chain from a CR/FR |
| `chain:status [chain-id]` | Show chain status and progress |
| `chain:list` | List all chains |

### Task Lifecycle

| Command | Description |
|---------|-------------|
| `task:add <chain-id> <slug> <title>` | Add a task to a chain |
| `task:ready <chain-id> <task-id>` | Move task from backlog to todo |
| `task:start <chain-id> <task-id>` | Move task to in-progress |
| `task:complete <chain-id> <task-id>` | Move task to in-review |
| `task:approve <chain-id> <task-id>` | Move task to done |
| `task:rework <chain-id> <task-id>` | Send task back to in-progress |
| `task:block <chain-id> <task-id>` | Mark task as blocked |
| `task:next <chain-id>` | Show next available task |
| `task:list <chain-id>` | List all tasks in chain |

### Status Flow

```
backlog → todo → in-progress → in-review → done
    ↓       ↓         ↓            ↓
  blocked ←←←←←←←←←←←←←←←←←←←←←←←←←
```

---

## File Structure

```
docs/tasks/
├── backlog/
│   └── CHAIN-001-feature/
│       └── 001-task.md
├── todo/
├── in-progress/
├── in-review/
├── done/
│   └── 2025-12/
└── blocked/
```

---

## Linked ADRs

- [ADR-001: Task File Format](../../adr/done/ADR-001-task-file-format.md)

---

## Linked Personas

- [AI Agent](../personas/ai-agent.md)
- [Solo Developer](../personas/solo-developer.md)
- [Team Lead](../personas/team-lead.md)
- [Open Source Maintainer](../personas/open-source-maintainer.md)

---

## Linked Use Cases

- [Create and Execute Task Chain](../use-cases/create-execute-task-chain.md)
- [Review and Approve Work](../use-cases/review-approve-work.md)
- [Debug Failed Task](../use-cases/debug-failed-task.md)
- [Bootstrap New Project](../use-cases/bootstrap-new-project.md)
- [Onboard New Contributor](../use-cases/onboard-new-contributor.md)

---

## Linked Scenarios

- [Control Agent Workflow](../scenarios/control-agent-workflow.md)
- [Implementation Agent Workflow](../scenarios/implementation-agent-workflow.md)

---

## Acceptance Criteria

- [ ] `chain:new` command creates a new chain from a CR/FR
- [ ] `chain:status` command shows chain status and progress
- [ ] `chain:list` command lists all chains
- [ ] `task:add` command adds a task to a chain
- [ ] Task status transitions follow the defined flow (backlog → todo → in-progress → in-review → done)
- [ ] `task:block` can mark any task as blocked
- [ ] `task:rework` sends a task back to in-progress
- [ ] `task:next` shows the next available task in a chain
- [ ] Task files are organized in the correct directory structure
- [ ] Chain completion hooks can run validation before marking chains done

---

## Implementation

- `packages/core/src/tasks/`
- `packages/cli/src/cli.ts`

---

## Chain Hooks and Validation

- Chain lifecycle hooks (`ChainHooks.onComplete`) support a `validation` action type executed by `TransitionHookRunner`. The action invokes the chain completion gate (`runChainCompletionGate`), which delegates to the validation runner (`runChainValidation`) and returns a `ChainCompletionGateResult`.
- Validation checks are configured via `ChainValidationConfig` / `ChainValidationCheck` and can be overridden per chain. Default checks cover task state, completion notes, acceptance criteria, design doc updates, and test coverage.
- If required checks fail, the hook throws and blocks completion, surfacing actionable feedback from the validation results; passing checks allow chain completion to proceed.
