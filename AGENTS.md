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
