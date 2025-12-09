# Task: Implement sessions router for agent session state

**Chain**: CHAIN-042-web-api-server  
**Task**: 006-sessions-router  
**Status**: in-review  
**Type**: impl  
**Created**: 2025-12-09

---

## Objective

Create the sessions tRPC router for agent session state. This router derives session information from active locks and in-progress tasks using `LockManager` from `@choragen/core`.

---

## Expected Files

- `packages/web/src/server/routers/`
- `├── sessions.ts            # Sessions router for agent state`
- `└── index.ts               # Updated to include sessionsRouter`

---

## Acceptance Criteria

- [ ] src/server/routers/sessions.ts created with procedures:
- [ ] - list - query: returns all active sessions (derived from locks)
- [ ] - get - query: returns session details by chain ID
- [ ] - getActiveLocks - query: returns all active file locks
- [ ] - getLockForChain - query: returns lock for specific chain
- [ ] Session info derived from LockManager.getLockFile()
- [ ] Zod schemas for all inputs
- [ ] sessionsRouter exported and added to appRouter in index.ts
- [ ] TypeScript compiles without errors
- [ ] pnpm lint passes

---

## Notes

**LockManager API** (from `@choragen/core`):
```typescript
import { LockManager, type LockFile, type FileLock } from '@choragen/core';

const manager = new LockManager(ctx.projectRoot);

// Read operations
manager.getLockFile(): Promise<LockFile>
manager.getLock(chainId: string): Promise<FileLock | null>
manager.checkConflicts(patterns: string[]): Promise<ConflictResult>
```

**LockFile Structure**:
```typescript
interface LockFile {
  version: 1;
  chains: Record<string, FileLock>;  // chainId -> lock
}

interface FileLock {
  files: string[];      // Glob patterns
  acquired: Date;
  agent: string;        // Agent identifier
  expiresAt?: Date;
}
```

**Session Derivation**:
- Each lock entry represents an active session
- `agent` field identifies the agent role (impl/control)
- `acquired` timestamp shows session start
- `files` shows what the session is working on

**Reference CR**: `docs/requests/change-requests/doing/CR-20251208-002-web-api-server.md`

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
