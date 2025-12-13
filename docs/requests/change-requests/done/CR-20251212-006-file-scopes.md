# Change Request: File Scopes for Tasks and Chains

**ID**: CR-20251212-006  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-12  
**Owner**: agent  

---

## What

Add file scope declarations to tasks and chains to enable safe parallel execution. Each task declares which files it intends to modify; chains aggregate their tasks' scopes.

### Data Model Changes

**Task**:
```typescript
interface Task {
  // ... existing fields
  fileScope: string[];  // Glob patterns of files this task will modify
}
```

**Chain**:
```typescript
interface Chain {
  // ... existing fields
  fileScope: string[];  // Aggregated from tasks, or explicitly declared
}
```

### Collision Detection

Before spawning parallel chains, the orchestrator checks for scope overlap:
- If scopes overlap → chains must run sequentially
- If scopes are disjoint → chains can run in parallel

### Integration with Locks

File scopes integrate with the existing lock system:
- When a chain starts, it acquires locks for its file scope
- Lock conflicts are detected before spawning, not at runtime
- Scope validation happens at chain creation time

---

## Why

Parallel chain execution is a key goal, but without file scope tracking:

1. **Collision risk** — Two chains might modify the same file
2. **Lock contention** — Locks acquired at runtime cause failures
3. **No planning visibility** — Orchestrator can't predict conflicts
4. **Manual coordination** — Human must track which chains can run together

File scopes make parallelism safe and automatic.

---

## Scope

**In Scope**:
- Add `fileScope` field to Task schema
- Add `fileScope` field to Chain schema
- Collision detection function for scope overlap
- Integration with lock acquisition
- CLI commands to view/validate scopes
- Orchestrator uses scopes to determine parallelism

**Out of Scope**:
- Automatic scope inference from code analysis
- Runtime scope violation detection (governance handles this)
- Scope inheritance/templates

---

## Affected Design Documents

- docs/design/core/features/standard-workflow.md
- docs/design/core/features/task-chain-management.md

---

## Linked ADRs

- ADR-TBD: File Scope Design

---

## Commits

_Pending commit by user_

---

## Implementation Notes

Key implementation areas:

1. **Schema updates** — Add `fileScope: string[]` to task and chain types
2. **Task file format** — Add `fileScope` section to task markdown template
3. **Chain metadata** — Store aggregated scope in `.chains/` metadata
4. **Collision detection** — `hasOverlap(scopeA: string[], scopeB: string[]): boolean`
5. **Lock integration** — `lock:acquire` uses chain's file scope
6. **CLI commands**:
   - `choragen chain:scope <chain-id>` — View chain's file scope
   - `choragen chain:conflicts <chain-id>` — Check for conflicts with other active chains
7. **Orchestrator logic** — Before spawning chains, group by non-overlapping scopes

---

## Completion Notes

**Completed**: 2025-12-12

### Implemented

1. **Schema updates** (`packages/core/src/tasks/types.ts`)
   - Added `fileScope?: string[]` to `Task` interface
   - Added `fileScope?: string[]` to `Chain` interface
   - Added `fileScope` to `CreateTaskOptions` and `CreateChainOptions`

2. **Task parser** (`packages/core/src/tasks/task-parser.ts`)
   - Parses `## File Scope` section from task markdown
   - Serializes `fileScope` patterns to markdown

3. **Chain manager** (`packages/core/src/tasks/chain-manager.ts`)
   - Aggregates `fileScope` from tasks and chain metadata
   - Added `acquireLocks(chainId, agent)` method for scope-based locking

4. **Collision detection** (`packages/core/src/tasks/scope-utils.ts`)
   - `hasOverlap(scopeA, scopeB)` — detects overlapping patterns
   - `getOverlappingPatterns(scopeA, scopeB)` — returns specific overlaps
   - `findConflictingChains(chainId)` — finds chains with overlapping scopes

5. **Lock integration** (`packages/core/src/locks/lock-manager.ts`)
   - `acquireForScope(chainId, fileScope)` — acquires locks for scope patterns
   - `checkScopeConflicts(fileScope)` — returns conflicting locks

6. **CLI commands** (`packages/cli/src/cli.ts`)
   - `choragen chain:scope <chain-id>` — displays chain's file scope
   - `choragen chain:conflicts <chain-id>` — lists chains with overlapping scopes

### Tests Added

- `packages/core/src/tasks/__tests__/task-parser.test.ts` — fileScope parsing/serialization
- `packages/core/src/tasks/__tests__/scope-utils.test.ts` — overlap detection, conflict finding
- `packages/core/src/locks/__tests__/lock-manager.test.ts` — scope integration, chain manager integration
- `packages/cli/src/__tests__/cli.test.ts` — chain:scope and chain:conflicts commands

### Out of Scope (as planned)

- Automatic scope inference from code analysis
- Runtime scope violation detection
- Scope inheritance/templates
