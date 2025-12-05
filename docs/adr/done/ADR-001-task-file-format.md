# ADR-001: Task File Format and Directory Structure

**Status**: Done  
**Created**: 2025-12-05  
**Linked CR**: CR-20251205-001  

---

## Context

We need a way to persist task state that:
1. Survives agent context loss
2. Is human-readable and editable
3. Works with git for history and collaboration
4. Enables kanban-style workflow visualization

---

## Decision

### Directory Structure

Tasks are organized in kanban-style status directories:

```
docs/tasks/
├── backlog/
├── todo/
├── in-progress/
├── in-review/
├── done/
│   └── YYYY-MM/  (archived by month)
└── blocked/
```

### Chain Directories

Chains group related tasks:

```
docs/tasks/todo/
└── CHAIN-001-profile-backend/
    ├── 001-api-routes.md
    ├── 002-repository.md
    └── 003-tests.md
```

Chain ID format: `CHAIN-NNN-slug`

### Task File Format

Tasks are markdown files with metadata:

```markdown
# Task: Task Title

**Chain**: CHAIN-001-slug  
**Task**: 001-task-slug  
**Status**: todo  
**Created**: 2025-12-05

---

## Objective

Description of what to accomplish.

---

## Expected Files

- `path/to/file1.ts`
- `path/to/file2.ts`

---

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

---

## Notes

Additional context.
```

### Status Transitions

```
backlog → todo → in-progress → in-review → done
    ↓       ↓         ↓            ↓
  blocked ←←←←←←←←←←←←←←←←←←←←←←←←←
```

---

## Consequences

**Positive**:
- Files are the source of truth, not agent memory
- Git provides full history
- Human-readable and editable
- Directory location = status (no parsing needed for kanban view)

**Negative**:
- File moves on every status change
- Potential for conflicts if multiple agents edit same task
- No real-time sync between agents

**Mitigations**:
- File locking prevents concurrent edits
- Chain-level locking prevents task conflicts

---

## Implementation

- `packages/core/src/tasks/task-parser.ts`
- `packages/core/src/tasks/task-manager.ts`
- `packages/core/src/tasks/chain-manager.ts`
