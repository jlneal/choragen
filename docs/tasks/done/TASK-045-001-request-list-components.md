# Task: Request List Components

**ID**: TASK-045-001  
**Chain**: CHAIN-045-request-browser  
**Type**: impl  
**Status**: done  
**Created**: 2025-12-09  

---

## Objective

Create the foundational components for displaying requests in the list view.

---

## Deliverables

1. **`src/components/requests/request-status-badge.tsx`**
   - Status badge for requests (todo, doing, done)
   - Follow pattern from `chain-status-badge.tsx`
   - Colors: blue (todo), amber (doing), green (done)

2. **`src/components/requests/request-type-badge.tsx`**
   - Type badge for CR vs FR
   - CR: violet styling
   - FR: orange styling

3. **`src/components/requests/request-card.tsx`**
   - Card component for request list items
   - Props: id, title, type, domain, status, created, criteriaProgress
   - Show: ID, title, domain badge, status badge, criteria progress (e.g., "3/6")
   - Link to `/requests/[id]`
   - Follow pattern from `chain-card.tsx`

4. **`src/components/requests/index.ts`**
   - Barrel export for all request components

---

## Technical Notes

- Use `// ADR: ADR-011-web-api-architecture` comment at top
- Follow existing component patterns in `src/components/chains/`
- Use shadcn/ui Badge, Card components
- Use Lucide icons (FileText, Bug for FR)
- Use `cn()` utility for class merging

---

## Acceptance Criteria

- [x] RequestStatusBadge renders correctly for all 3 statuses
- [x] RequestTypeBadge distinguishes CR from FR
- [x] RequestCard displays all required fields
- [x] RequestCard links to detail page
- [x] Components exported from index.ts
- [x] No TypeScript errors
