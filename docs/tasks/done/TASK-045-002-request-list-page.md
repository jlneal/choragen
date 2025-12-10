# Task: Request List Page

**ID**: TASK-045-002  
**Chain**: CHAIN-045-request-browser  
**Type**: impl  
**Status**: done  
**Created**: 2025-12-09  

---

## Objective

Implement the request list page with tabs for CR/FR, filtering, and sorting.

---

## Deliverables

1. **`src/components/requests/request-tabs.tsx`**
   - Tab switcher: All | Change Requests | Fix Requests
   - Use shadcn Tabs component or custom buttons
   - Track active tab state

2. **`src/components/requests/request-filters.tsx`**
   - Filter by status (todo, doing, done)
   - Filter by domain (dropdown)
   - Clear filters button

3. **`src/components/requests/request-sort.tsx`**
   - Sort by: Date (newest/oldest), Status
   - Follow pattern from `chain-sort.tsx`

4. **`src/components/requests/request-list.tsx`**
   - Client component with `"use client"`
   - Fetch requests via tRPC: `trpc.requests.list.useQuery()`
   - Apply filters and sorting
   - Render RequestCard for each request
   - Group by type when showing "All"

5. **Update `src/app/requests/page.tsx`**
   - Replace placeholder with RequestList
   - Add page header with title and description

---

## Technical Notes

- tRPC procedures available:
  - `requests.list` - all requests
  - `requests.listChangeRequests` - CRs only
  - `requests.listFixRequests` - FRs only
- RequestMetadata type from router has: id, type, title, domain, status, created, owner, severity, filename

---

## Acceptance Criteria

- [x] Tabs switch between All/CR/FR views
- [x] Status filter works
- [x] Domain filter works  
- [x] Sort by date works
- [x] Sort by status works
- [x] Requests display in cards
- [x] No TypeScript errors
