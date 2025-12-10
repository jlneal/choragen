# Change Request: Web Task Creation

**ID**: CR-20251210-003  
**Domain**: dashboard  
**Status**: todo  
**Created**: 2025-12-10  
**Owner**: agent  

---

## What

Add the ability to create tasks within chains directly from the web dashboard.

---

## Why

Tasks are currently created via CLI (`choragen task:add`) or manual file creation. Web-based creation enables:

- Visual task planning within chain context
- Form-driven task specification with validation
- Immediate task visibility in chain detail view
- Streamlined workflow for control agents using the web UI

---

## Scope

**In Scope**:
- "Add Task" button in chain detail page
- Form dialog with task fields (title, objective, acceptance criteria, type)
- Task markdown file creation in `docs/tasks/todo/{chain-id}/`
- Automatic task ID generation (TASK-{chain-seq}-{task-seq})
- Task type selection (impl/control)

**Out of Scope**:
- Task templates beyond the standard format
- Drag-and-drop task reordering
- Task dependencies/blocking relationships
- Bulk task creation

---

## Proposed Changes

### UI Components

```
┌─────────────────────────────────────────────────┐
│ CHAIN-057-project-selector          [+ Add Task]│
├─────────────────────────────────────────────────┤
│ Tasks                                           │
│ ├─ TASK-057-001 ✓                              │
│ ├─ TASK-057-002 ✓                              │
│ └─ TASK-057-003 ○                              │
└─────────────────────────────────────────────────┘
```

### Form Fields

- Title (required)
- Type (select: impl, control)
- Objective (textarea, required)
- Context (textarea)
- Expected Files (textarea, one per line)
- Acceptance Criteria (textarea, one per line, becomes checkboxes)
- Constraints (textarea)
- Notes (textarea)

### tRPC Procedures

```typescript
tasks.create.mutate({ 
  chainId, 
  title, 
  type, 
  objective, 
  context, 
  expectedFiles, 
  acceptanceCriteria, 
  constraints, 
  notes 
})
```

---

## Affected Design Documents

- `docs/design/core/enhancements/dashboard-ui.md`

---

## Linked ADRs

- ADR-011-web-api-architecture

---

## Commits

No commits yet.

---

## Implementation Notes

Use `templates/task.md` as the basis for file generation. Parse acceptance criteria into `- [ ]` checkbox format.

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
