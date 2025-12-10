# Change Request: Request Tagging

**ID**: CR-20251209-023  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-09  
**Owner**: agent  

---

## What

Add tagging support for Change Requests and Fix Requests.

---

## Why

Tags enable flexible categorization of requests:

- Filter requests by topic (e.g., `dashboard`, `api`, `docs`)
- Track cross-cutting concerns (e.g., `tech-debt`, `ux`, `performance`)
- Enable tag-to-group conversion for batch operations
- Improve discoverability in large backlogs

---

## Scope

**In Scope**:
- Add `tags` field to request markdown frontmatter
- Tag CRUD in web UI (add, remove, rename)
- Filter requests by tag
- Tag autocomplete from existing tags
- Tag-based search

**Out of Scope**:
- Tag hierarchies/nesting
- Tag colors/icons (future enhancement)
- Cross-project tags

---

## Proposed Changes

### Request Format

```markdown
**ID**: CR-20251209-023  
**Domain**: core  
**Status**: todo  
**Tags**: dashboard, phase-2, high-priority  
```

### Data Model

```typescript
interface Request {
  // ... existing fields
  tags: string[];
}
```

### tRPC Procedures

```typescript
requests.addTag({ requestId, tag })
requests.removeTag({ requestId, tag })
tags.list()  // All unique tags in project
tags.rename({ oldTag, newTag })  // Rename across all requests
```

### UI Components

- **TagInput**: Autocomplete tag input
- **TagBadge**: Clickable tag badge (filters on click)
- **TagFilter**: Multi-select tag filter in request list

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

Tags are stored in request markdown files, not a separate database. Tag operations update the file directly.

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
