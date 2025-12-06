# @choragen/core

Core primitives for agentic software development: task chains, governance, and file locking.

## Purpose

This package provides the foundational building blocks that transform stateless language models into stateful, accountable workers:

- **Task chains**: Persistent task state that survives context loss
- **Governance**: Declarative policies for file mutation control
- **File locking**: Advisory locks to prevent parallel chain collisions

## Key Exports

### Task Management

```typescript
import {
  TaskParser,
  TaskManager,
  ChainManager,
  type Task,
  type Chain,
  type TaskStatus,
} from "@choragen/core";
```

- `TaskParser` - Parse task markdown files
- `TaskManager` - CRUD operations on tasks
- `ChainManager` - Chain lifecycle management

### Governance

```typescript
import {
  GovernanceParser,
  GovernanceChecker,
  type GovernanceSchema,
  type MutationAction,
} from "@choragen/core";
```

- `GovernanceParser` - Parse `choragen.governance.yaml`
- `GovernanceChecker` - Check if mutations are allowed/denied/require approval

### File Locking

```typescript
import { LockManager, type Lock, type LockFile } from "@choragen/core";
```

- `LockManager` - Acquire, release, and check file pattern locks

### Utilities

```typescript
import { globMatch } from "@choragen/core";
```

- `globMatch` - Glob pattern matching for governance and locks

## Directory Structure

```
src/
├── tasks/
│   ├── task-parser.ts
│   ├── task-manager.ts
│   └── chain-manager.ts
├── governance/
│   ├── types.ts
│   ├── governance-parser.ts
│   └── governance-checker.ts
├── locks/
│   ├── types.ts
│   └── lock-manager.ts
└── utils/
    └── glob.ts
```

## Coding Conventions

- All public APIs use TypeScript interfaces (not classes where possible)
- Prefer pure functions over stateful classes
- All file I/O is async
- Errors are thrown, not returned (caller handles)
- Use `Result<T, E>` pattern for operations that may fail expectedly

## Related ADRs

- **ADR-001**: Task file format and directory structure
- **ADR-002**: Governance schema design
- **ADR-003**: File locking for parallel chains

## Testing

```bash
pnpm --filter @choragen/core test
pnpm --filter @choragen/core typecheck
```
