# Task: Request Detail Page

**ID**: TASK-045-004  
**Chain**: CHAIN-045-request-browser  
**Type**: impl  
**Status**: done  
**Created**: 2025-12-09  

---

## Objective

Implement the request detail page with full content display.

---

## Deliverables

1. **Update `src/app/requests/[id]/page.tsx`**
   - Replace placeholder with real implementation
   - Fetch request via tRPC: `requests.getContent`
   - Display RequestHeader
   - Display RequestContent (Summary, Motivation, Scope)
   - Display AcceptanceCriteriaList
   - Display LinkedChains section

2. **Create `src/app/requests/[id]/request-detail-client.tsx`**
   - Client component wrapper for tRPC queries
   - Handle loading and error states
   - Compose detail components

---

## Technical Notes

- Page component can be server component
- Client component handles tRPC data fetching
- Use Card components for sections
- Follow layout from CR mockup in design doc

---

## Acceptance Criteria

- [x] Detail page loads request by ID
- [x] Shows request header with metadata
- [x] Displays Summary section
- [x] Displays Acceptance Criteria with progress
- [x] Shows Linked Chains section
- [x] Back navigation works
- [x] No TypeScript errors
