# Task: Implement Request Tagging

**Chain**: CHAIN-048  
**Task**: T001  
**Type**: impl  
**Status**: todo  
**Request**: CR-20251209-023  

---

## Objective

Add tagging support for Change Requests and Fix Requests.

---

## Acceptance Criteria

1. **Tags field in frontmatter**: Add `Tags:` field to request markdown parsing
2. **tRPC procedures**: Implement `requests.addTag`, `requests.removeTag`, `tags.list`, `tags.rename`
3. **UI components**: TagInput (autocomplete), TagBadge (clickable), TagFilter (multi-select)
4. **Filter by tag**: Request list can filter by one or more tags
5. **Tests**: Unit tests for tag operations

---

## Implementation Guide

### 1. Update Request Parser

In `packages/web/src/server/routers/requests.ts`, update the request parsing to extract tags:

```typescript
// Add to Request interface
tags: string[];

// Parse from frontmatter: **Tags**: tag1, tag2, tag3
```

### 2. Add tRPC Procedures

Create `packages/web/src/server/routers/tags.ts`:

```typescript
requests.addTag({ requestId, tag })     // Update markdown file
requests.removeTag({ requestId, tag })  // Update markdown file
tags.list()                             // Scan all requests for unique tags
tags.rename({ oldTag, newTag })         // Update all requests with old tag
```

### 3. UI Components

- `packages/web/src/components/tags/tag-input.tsx` - Autocomplete input
- `packages/web/src/components/tags/tag-badge.tsx` - Clickable badge
- `packages/web/src/components/tags/tag-filter.tsx` - Multi-select filter

### 4. Integration

- Add TagBadge to RequestCard
- Add TagFilter to request list views
- Add TagInput to request detail view

---

## Files to Modify

- `packages/web/src/server/routers/requests.ts` - Add tags parsing
- `packages/web/src/server/routers/index.ts` - Add tags router
- `packages/web/src/components/requests/request-card.tsx` - Show tags
- `packages/web/src/app/requests/page.tsx` - Add filter

## Files to Create

- `packages/web/src/server/routers/tags.ts` - Tags router
- `packages/web/src/components/tags/tag-input.tsx`
- `packages/web/src/components/tags/tag-badge.tsx`
- `packages/web/src/components/tags/tag-filter.tsx`
- `packages/web/src/__tests__/tags.test.ts`

---

## Notes

Tags are stored in request markdown files, not a separate database. Tag operations update the file directly.
