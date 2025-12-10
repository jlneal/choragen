# Change Request: Chain Management

**ID**: CR-20251209-020  
**Domain**: dashboard  
**Status**: todo  
**Created**: 2025-12-09  
**Owner**: agent  

---

## What

Add chain and task creation capabilities to the web dashboard.

---

## Why

Currently chains and tasks can only be created via CLI (`choragen chain:new`, `choragen task:add`). Web-based chain management enables:

- Visual chain planning and task breakdown
- Drag-and-drop task reordering
- Quick task creation without context switching

---

## Scope

**In Scope**:
- Create new chain from request
- Add tasks to chain
- Reorder tasks within chain
- Edit task details (title, description, acceptance criteria)
- Delete tasks

**Out of Scope**:
- Task templates
- Cross-chain task dependencies
- Automated task generation

---

## Proposed Changes

### New tRPC Procedures

```typescript
chains.create({ requestId, slug, title })
chains.addTask({ chainId, slug, title, description })
chains.reorderTasks({ chainId, taskIds: string[] })
chains.deleteTask({ chainId, taskId })
tasks.update({ taskId, updates })
```

### UI Components

- **ChainCreator**: Form to create chain from request
- **TaskAdder**: Quick-add task form
- **TaskList**: Draggable task list for reordering
- **TaskEditor**: Edit task details inline

---

## Affected Design Documents

- `docs/design/core/features/web-dashboard.md`

---

## Linked ADRs

- ADR-011-web-api-architecture

---

## Commits

No commits yet.

---

## Implementation Notes

Task reordering should update the chain's task array in `.chains/CHAIN-xxx.json`.

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
