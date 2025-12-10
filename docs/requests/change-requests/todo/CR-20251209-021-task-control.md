# Change Request: Task Control

**ID**: CR-20251209-021  
**Domain**: dashboard  
**Status**: todo  
**Created**: 2025-12-09  
**Owner**: agent  

---

## What

Add task state transition controls to the web dashboard.

---

## Why

Currently task transitions require CLI commands (`choragen task:start`, `task:complete`, etc.). Web-based task control enables:

- One-click task transitions
- Visual workflow progression
- Real-time status updates

---

## Scope

**In Scope**:
- Start task (todo → in-progress)
- Complete task (in-progress → done)
- Rework task (done → todo with rework iteration)
- Block/unblock task
- View task history

**Out of Scope**:
- Automated task assignment
- Task time tracking
- Task comments/discussion

---

## Proposed Changes

### New tRPC Procedures

```typescript
tasks.start({ chainId, taskId })
tasks.complete({ chainId, taskId })
tasks.rework({ chainId, taskId, reason })
tasks.block({ chainId, taskId, reason })
tasks.unblock({ chainId, taskId })
```

### UI Components

- **TaskActions**: Button group for available transitions
- **TaskStatusBadge**: Visual status indicator (existing, enhance)
- **ReworkDialog**: Modal for rework reason input
- **TaskHistory**: Timeline of task state changes

### Integration

- Emit metrics events on transitions
- Respect governance rules for task operations
- Update chain status when all tasks complete

---

## Affected Design Documents

- `docs/design/core/features/web-dashboard.md`

---

## Linked ADRs

- ADR-011-web-api-architecture
- ADR-004-pipeline-metrics

---

## Commits

No commits yet.

---

## Implementation Notes

Task transitions should mirror CLI behavior exactly, including metrics emission and file moves.

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
