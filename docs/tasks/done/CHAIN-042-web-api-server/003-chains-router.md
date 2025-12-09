# Task: Implement chains router with CRUD procedures

**Chain**: CHAIN-042-web-api-server  
**Task**: 003-chains-router  
**Status**: in-review  
**Type**: impl  
**Created**: 2025-12-09

---

## Objective

Create the chains tRPC router with full CRUD operations using `ChainManager` from `@choragen/core`. This router exposes chain management functionality to the web dashboard.

---

## Expected Files

- `packages/web/src/server/routers/`
- `├── chains.ts              # Chains router with CRUD procedures`
- `└── index.ts               # Updated to include chainsRouter`

---

## Acceptance Criteria

- [ ] src/server/routers/chains.ts created with procedures:
- [ ] - list - query: returns all chains via getAllChains()
- [ ] - get - query: returns single chain by ID via getChain(chainId)
- [ ] - getSummary - query: returns chain summary via getChainSummary(chainId)
- [ ] - create - mutation: creates chain via createChain(options)
- [ ] - update - mutation: updates chain via updateChain(chainId, updates)
- [ ] - delete - mutation: deletes chain via deleteChain(chainId)
- [ ] - addTask - mutation: adds task to chain via addTask(chainId, options)
- [ ] - getNextTask - query: returns next task via getNextTask(chainId)
- [ ] Zod schemas for all inputs
- [ ] chainsRouter exported and added to appRouter in index.ts
- [ ] TypeScript compiles without errors
- [ ] pnpm lint passes

---

## Notes

**ChainManager API** (from `@choragen/core`):
```typescript
import { ChainManager } from '@choragen/core';

const manager = new ChainManager(ctx.projectRoot);

// Read operations
manager.getAllChains(): Promise<Chain[]>
manager.getChain(chainId: string): Promise<Chain | null>
manager.getChainSummary(chainId: string): Promise<ChainSummary | null>
manager.getNextTask(chainId: string): Promise<Task | null>

// Write operations
manager.createChain(options: CreateChainOptions): Promise<Chain>
manager.updateChain(chainId: string, updates: Partial<Chain>): Promise<Chain | null>
manager.deleteChain(chainId: string): Promise<boolean>
manager.addTask(chainId: string, options: TaskOptions): Promise<Task>
```

**CreateChainOptions**:
```typescript
interface CreateChainOptions {
  requestId: string;
  slug: string;
  title: string;
  description?: string;
  type?: 'design' | 'implementation';
  dependsOn?: string[];
}
```

**Reference CR**: `docs/requests/change-requests/doing/CR-20251208-002-web-api-server.md`

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
