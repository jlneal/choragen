# @choragen/cli

Command-line interface for managing task chains, governance, and file locks.

## Purpose

Provides the `choragen` CLI that agents and humans use to:

- Create and manage task chains
- Transition tasks through workflow states
- Check governance policies
- Acquire and release file locks

## Key Commands

### Chain Management

```bash
choragen chain:new <cr-id> <slug> [title]   # Create new chain from CR
choragen chain:status [chain-id]            # Show chain status
choragen chain:list                         # List all chains
```

### Task Management

```bash
choragen task:add <chain-id> <slug> <title> # Add task to chain
choragen task:ready <chain-id> <task-id>    # Mark task ready
choragen task:start <chain-id> <task-id>    # Start working on task
choragen task:complete <chain-id> <task-id> # Mark task complete
choragen task:approve <chain-id> <task-id>  # Approve completed task
choragen task:rework <chain-id> <task-id>   # Send task back for rework
choragen task:block <chain-id> <task-id>    # Block task
choragen task:next <chain-id>               # Get next available task
choragen task:list <chain-id>               # List tasks in chain
```

### Governance

```bash
choragen governance:check <action> <file1> [file2...]
```

Actions: `create`, `modify`, `delete`

### Locks

```bash
choragen lock:acquire <chain-id> <pattern1> [pattern2...]
choragen lock:release <chain-id>
choragen lock:status
```

## Directory Structure

```
src/
├── commands/
│   ├── chain/
│   │   ├── new.ts
│   │   ├── status.ts
│   │   └── list.ts
│   ├── task/
│   │   ├── add.ts
│   │   ├── start.ts
│   │   ├── complete.ts
│   │   └── ...
│   ├── governance/
│   │   └── check.ts
│   └── lock/
│       ├── acquire.ts
│       ├── release.ts
│       └── status.ts
├── utils/
│   └── output.ts
└── index.ts
```

## Coding Conventions

- Commands are thin wrappers around `@choragen/core`
- Use `commander` or similar for CLI parsing
- Output is human-readable by default, `--json` for machine-readable
- Exit codes: 0 = success, 1 = error, 2 = governance violation

## Related ADRs

- **ADR-001**: Task file format (defines task commands behavior)

## Testing

```bash
pnpm --filter @choragen/cli test
pnpm --filter @choragen/cli typecheck
```
