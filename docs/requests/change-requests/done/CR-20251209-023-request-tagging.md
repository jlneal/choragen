# Change Request: Request Tagging

**ID**: CR-20251209-023  
**Domain**: core  
**Status**: done  
**Chain**: CHAIN-048  
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

See git log for CHAIN-048.

---

## Implementation Notes

Tags are stored in request markdown files, not a separate database. Tag operations update the file directly.

---

## Completion Notes

Implemented request tagging for the web dashboard:

**Files Created**:
- `packages/web/src/server/routers/tags.ts` — Tags router with list and rename procedures
- `packages/web/src/components/tags/tag-badge.tsx` — TagBadge and TagList components
- `packages/web/src/components/tags/tag-filter.tsx` — TagFilter multi-select dropdown
- `packages/web/src/components/tags/index.ts` — Component exports
- `packages/web/src/tests/routers/tags.test.ts` — Unit tests (13 tests)

**Files Modified**:
- `packages/web/src/server/routers/requests.ts` — Added tags field parsing, addTag and removeTag mutations
- `packages/web/src/server/routers/index.ts` — Added tags router to appRouter
- `packages/web/src/components/requests/request-card.tsx` — Added tags display with TagList
- `packages/web/src/components/requests/request-list.tsx` — Added tag filtering with TagFilter

**Features**:
- Tags field in frontmatter: `**Tags**: tag1, tag2, tag3`
- tRPC procedures: addTag, removeTag, tags.list, tags.rename
- UI components: TagBadge, TagList, TagFilter
- Filter by tag in request list (AND logic)
- 13 unit tests covering all tag operations

**Chain**: CHAIN-048-request-tagging
**Completed**: 2025-12-09
