# Task: Add unit tests for all router procedures

**Chain**: CHAIN-042-web-api-server  
**Task**: 011-unit-tests  
**Status**: in-review  
**Type**: impl  
**Created**: 2025-12-09

---

## Objective

Add unit tests for the tRPC router procedures using Vitest. Tests should verify that routers correctly call the underlying managers and return expected data.

---

## Expected Files

- `packages/web/`
- `├── src/__tests__/`
- `│   └── routers/`
- `│       ├── chains.test.ts     # Tests for chains router`
- `│       ├── tasks.test.ts      # Tests for tasks router`
- `│       └── health.test.ts     # Tests for health check`
- `├── vitest.config.ts           # Vitest configuration`
- `└── package.json               # Updated with test scripts`

---

## Acceptance Criteria

- [ ] Vitest configured for the web package
- [ ] Test file for chains router with basic procedure tests
- [ ] Test file for tasks router with basic procedure tests
- [ ] Test file for health check procedure
- [ ] pnpm --filter @choragen/web test runs successfully
- [ ] TypeScript compiles without errors
- [ ] pnpm lint passes

---

## Notes

**Testing Pattern with tRPC Caller**:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCallerFactory } from '@/server/trpc';
import { appRouter } from '@/server/routers';

describe('chains router', () => {
  const createCaller = createCallerFactory(appRouter);
  
  it('health check returns ok', async () => {
    const caller = createCaller({ projectRoot: '/tmp/test' });
    const result = await caller.health();
    expect(result.status).toBe('ok');
  });
});
```

**Mocking Core Managers**:
```typescript
vi.mock('@choragen/core', () => ({
  ChainManager: vi.fn().mockImplementation(() => ({
    getAllChains: vi.fn().mockResolvedValue([]),
    getChain: vi.fn().mockResolvedValue(null),
  })),
}));
```

**Vitest Config**:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Reference CR**: `docs/requests/change-requests/doing/CR-20251208-002-web-api-server.md`

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
