# Change Request: Request Management

**ID**: CR-20251209-019  
**Domain**: dashboard  
**Status**: todo  
**Created**: 2025-12-09  
**Owner**: agent  

---

## What

Add CRUD operations for Change Requests and Fix Requests in the web dashboard.

---

## Why

Currently requests can only be created/edited via file system. Web-based request management enables:

- Faster request creation without leaving the dashboard
- Inline editing of request content
- Visual workflow for moving requests through states
- Lower barrier to entry for non-CLI users

---

## Scope

**In Scope**:
- Create new CR/FR from web UI
- Edit request title, description, scope
- Move requests between states (todo → doing → done)
- Close requests with completion notes
- Delete/archive requests

**Out of Scope**:
- Rich text editor (markdown only)
- Request templates library
- Bulk operations

---

## Proposed Changes

### New tRPC Procedures

```typescript
requests.create({ type: 'cr' | 'fr', title, domain, ... })
requests.update({ id, updates })
requests.move({ id, toState: 'todo' | 'doing' | 'done' })
requests.close({ id, completionNotes })
requests.delete({ id })
```

### UI Components

- **RequestForm**: Create/edit form with markdown preview
- **RequestActions**: Dropdown with move/close/delete actions
- **RequestEditor**: Inline markdown editor for content

### File Operations

All operations write to the file system via `@choragen/core`:
- Create: Write new file to `todo/`
- Move: `fs.rename()` between directories
- Edit: Update file content
- Close: Add completion notes, move to `done/`

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

Ensure pre-commit validation rules are applied when closing requests (completion notes required, acceptance criteria checked).

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
