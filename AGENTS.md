# Agent Guidelines for Choragen

These guidelines apply to the entire repository.

## Project Overview

Choragen is a framework for agentic software development. It provides task chains, governance, and coordination primitives that transform stateless language models into stateful, accountable workers.

## Documentation Structure

```
docs/
├── requests/           # Change and fix requests
│   ├── change-requests/
│   │   ├── todo/
│   │   ├── doing/
│   │   └── done/
│   └── fix-requests/
│       ├── todo/
│       ├── doing/
│       └── done/
│
├── adr/                # Architecture Decision Records
│   ├── todo/
│   ├── doing/
│   ├── done/
│   └── archive/
│
├── design/             # Design documentation
│   └── core/
│       ├── scenarios/
│       ├── features/
│       └── enhancements/
│
└── architecture.md     # System overview
```

## Traceability Chain

Every artifact links backward:

```
Request (CR/FR)
  → Design Doc (WHAT)
    → ADR (HOW)
      → Implementation (Code)
        → Tests
```

## Commit Message Format

```
<type>(<scope>): <description>

[body]

[CR-xxx | FR-xxx]
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`

## Task Completion Checklist

Before marking any task complete:

```bash
# 1. Build
pnpm build

# 2. Test
pnpm --filter @choragen/core test

# 3. Type check
pnpm --filter @choragen/core typecheck
```

## Package Structure

| Package | Description |
|---------|-------------|
| `@choragen/core` | Task chains, governance, locks |
| `@choragen/cli` | Command-line interface |
| `@choragen/contracts` | DesignContract, ApiError, HttpStatus |
| `@choragen/eslint-plugin` | ESLint rules (future) |
| `@choragen/test-utils` | Testing utilities |

## CLI Commands

```bash
# Chain management
choragen chain:new <cr-id> <slug> [title]
choragen chain:status [chain-id]
choragen chain:list

# Task management
choragen task:add <chain-id> <slug> <title>
choragen task:ready <chain-id> <task-id>
choragen task:start <chain-id> <task-id>
choragen task:complete <chain-id> <task-id>
choragen task:approve <chain-id> <task-id>
choragen task:rework <chain-id> <task-id>
choragen task:block <chain-id> <task-id>
choragen task:next <chain-id>
choragen task:list <chain-id>

# Governance
choragen governance:check <action> <file1> [file2...]

# Locks
choragen lock:acquire <chain-id> <pattern1> [pattern2...]
choragen lock:release <chain-id>
choragen lock:status
```

## Self-Hosting

Choragen uses its own patterns for development:
- CRs/FRs in `docs/requests/`
- ADRs in `docs/adr/`
- Design docs in `docs/design/`
- Task chains in `docs/tasks/` (when working on features)

## Agent Roles

### Control Agent
The control agent manages work but **does not implement**:
- Creates CRs/FRs for new work
- Creates task chains and populates task files
- Reviews completed work from impl agents
- Approves or sends back for rework
- Commits and pushes completed work

### Commit Policy

Control agents commit after each chain completion:

1. After moving all tasks to `done/`
2. Before starting the next chain
3. Use this commit message format:

```
<type>(<scope>): complete <CHAIN-ID>

- Task 1 summary
- Task 2 summary
- ...

<CR-xxx | FR-xxx>
```

Types: `feat` (new feature), `fix` (bug fix), `docs` (documentation), `chore` (maintenance)

### Implementation Agent
The impl agent executes tasks:
- Reads task file for full context
- Implements according to acceptance criteria
- Runs verification commands
- Reports completion (does NOT move task files)

### Control-Only Tasks

Some tasks are control agent responsibilities with no impl handoff:
- Verification tasks (e.g., "verify and close CR")
- Review tasks
- CR/FR closure tasks

For these tasks:
1. Control agent executes the task directly
2. Control agent updates task status to `done`
3. Control agent moves task file to `done/<CHAIN-ID>/`

Mark control-only tasks with `**Type**: control` in the task header.

## CRITICAL: Never Skip the System

**Control agents must NEVER implement code directly.** Even for "quick fixes":

1. Create an FR (fix request) or CR (change request)
2. Create a task chain with task(s)
3. Hand off to impl agent with prompt
4. Review and approve

This ensures:
- Full traceability (every change has a request)
- Proper review (control agent verifies work)
- Reproducibility (task files capture context)
- Accountability (clear ownership)

### Handoff Prompt Template

```
You are an implementation agent working on the choragen project at /Users/justin/Projects/choragen

Your task is defined in this file:
docs/tasks/todo/<CHAIN-ID>/<TASK-FILE>.md

Read that file for your full instructions. Complete the task according to the acceptance criteria.

When done:
1. Run verification commands in the task
2. Report back what you completed
3. Do NOT move the task file - the control agent will review and approve

Start by reading the task file.
```
