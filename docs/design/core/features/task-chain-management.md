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

## Linked Scenarios

- [Control Agent Workflow](../scenarios/control-agent-workflow.md)
- [Implementation Agent Workflow](../scenarios/implementation-agent-workflow.md)

---

## Implementation

- `packages/core/src/tasks/`
- `packages/cli/src/cli.ts`
