# Task: Implement tasks router with CRUD procedures

**Chain**: CHAIN-042-web-api-server  
**Task**: 004-tasks-router  
**Status**: in-review  
**Type**: impl  
**Created**: 2025-12-09

---

## Objective

Create the tasks tRPC router with full CRUD operations and status transitions using `TaskManager` from `@choragen/core`. This router exposes task management functionality to the web dashboard.

---

## Expected Files

- `packages/web/src/server/routers/`
- `├── tasks.ts               # Tasks router with CRUD and transition procedures`
- `└── index.ts               # Updated to include tasksRouter`

---

## Acceptance Criteria

- [ ] src/server/routers/tasks.ts created with procedures:
- [ ] - get - query: returns task by chainId + taskId via getTask()
- [ ] - listForChain - query: returns all tasks for a chain via getTasksForChain()
- [ ] - create - mutation: creates task via createTask()
- [ ] - update - mutation: updates task content via updateTask()
- [ ] - delete - mutation: deletes task via deleteTask()
- [ ] - transition - mutation: transitions task status via transitionTask()
- [ ] - start - mutation: starts task (todo → in-progress) via startTask()
- [ ] - complete - mutation: completes task (in-progress → in-review) via completeTask()
- [ ] - approve - mutation: approves task (in-review → done) via approveTask()
- [ ] - rework - mutation: sends back for rework via reworkTask()
- [ ] - block - mutation: blocks task via blockTask()
- [ ] Zod schemas for all inputs
- [ ] tasksRouter exported and added to appRouter in index.ts
- [ ] TypeScript compiles without errors
- [ ] pnpm lint passes

---

## Notes

**TaskManager API** (from `@choragen/core`):
```typescript
import { TaskManager } from '@choragen/core';

const manager = new TaskManager(ctx.projectRoot);

// Read operations
manager.getTask(chainId, taskId): Promise<Task | null>
manager.getTasksForChain(chainId): Promise<Task[]>
manager.getNextTask(chainId): Promise<Task | null>

// Write operations
manager.createTask(options: CreateTaskOptions): Promise<Task>
manager.updateTask(chainId, taskId, updates): Promise<Task | null>
manager.deleteTask(chainId, taskId): Promise<boolean>

// Status transitions
manager.transitionTask(chainId, taskId, newStatus): Promise<TransitionResult>
manager.startTask(chainId, taskId): Promise<TransitionResult>
manager.completeTask(chainId, taskId): Promise<TransitionResult>
manager.approveTask(chainId, taskId): Promise<TransitionResult>
manager.reworkTask(chainId, taskId, reason?): Promise<TransitionResult>
manager.blockTask(chainId, taskId): Promise<TransitionResult>
```

**TaskStatus values**: `backlog`, `todo`, `in-progress`, `in-review`, `done`, `blocked`

**Note**: Access TaskManager via `ChainManager.getTaskManager()` or instantiate directly.

**Reference CR**: `docs/requests/change-requests/doing/CR-20251208-002-web-api-server.md`

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
