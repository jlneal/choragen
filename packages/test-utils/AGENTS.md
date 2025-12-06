# @choragen/test-utils

Testing utilities for choragen-based projects.

## Purpose

Provides helpers that make testing easier while maintaining type safety:

- **unsafeCast**: Type-safe partial mocks without lint violations
- **createMockTask**: Factory for test task objects
- **createMockChain**: Factory for test chain objects

## Key Exports

### unsafeCast

Cast partial objects to full types without triggering `@typescript-eslint/no-unsafe-type-assertion`:

```typescript
import { unsafeCast } from "@choragen/test-utils";

// ✅ CORRECT: Use unsafeCast for partial mocks
const mockManager = unsafeCast<TaskManager>({
  getTask: vi.fn(),
  updateTask: vi.fn(),
});

// ❌ WRONG: as unknown triggers lint error
const mockManager = { getTask: vi.fn() } as unknown as TaskManager;
```

### Test Factories

```typescript
import { createMockTask, createMockChain } from "@choragen/test-utils";

const task = createMockTask({
  id: "001-test",
  status: "in-progress",
});

const chain = createMockChain({
  id: "CHAIN-001-test",
  tasks: [task],
});
```

## Directory Structure

```
src/
├── unsafe-cast.ts
├── factories/
│   ├── task.ts
│   └── chain.ts
└── index.ts
```

## Coding Conventions

- All utilities are pure functions
- Factories use sensible defaults
- No test framework dependencies (works with vitest, jest, etc.)

## Common Patterns

### Mocking External Clients

```typescript
import { unsafeCast } from "@choragen/test-utils";

const mockFs = unsafeCast<typeof fs>({
  readFile: vi.fn().mockResolvedValue("content"),
  writeFile: vi.fn().mockResolvedValue(undefined),
});
```

### Creating Test Data

```typescript
import { createMockTask } from "@choragen/test-utils";

// Minimal - uses defaults
const task1 = createMockTask();

// Customized
const task2 = createMockTask({
  id: "002-custom",
  title: "Custom Task",
  status: "done",
});
```

## Related ADRs

- **ADR-002**: Governance schema design (unsafeCast enables type-safe testing)

## Testing

```bash
pnpm --filter @choragen/test-utils test
pnpm --filter @choragen/test-utils typecheck
```
