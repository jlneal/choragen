# Task: Request Detail Components

**ID**: TASK-045-003  
**Chain**: CHAIN-045-request-browser  
**Type**: impl  
**Status**: done  
**Created**: 2025-12-09  

---

## Objective

Create components for displaying request details including acceptance criteria.

---

## Deliverables

1. **`src/components/requests/request-header.tsx`**
   - Display: ID, title, type badge, status badge
   - Metadata row: domain, created date, owner
   - Back navigation link

2. **`src/components/requests/acceptance-criteria-list.tsx`**
   - Parse acceptance criteria from markdown content
   - Display as checklist with checkboxes (read-only)
   - Show progress: "6/10 completed"
   - Checked items: `- [x]`, unchecked: `- [ ]`

3. **`src/components/requests/request-content.tsx`**
   - Render markdown sections: Summary, Motivation, Scope
   - Simple text display (no full markdown renderer needed)
   - Extract sections by heading

4. **`src/components/requests/linked-chains.tsx`**
   - Display chains linked to this request
   - Show chain ID, title, status, progress
   - Link to chain detail page
   - Will need to query chains by requestId

---

## Technical Notes

- Use `requests.getContent` tRPC procedure to get raw markdown
- Parse acceptance criteria with regex: `/^- \[([ x])\] (.+)$/gm`
- Extract sections by splitting on `## ` headings

---

## Acceptance Criteria

- [x] RequestHeader displays all metadata
- [x] AcceptanceCriteriaList parses and displays criteria
- [x] AcceptanceCriteriaList shows progress count
- [x] RequestContent extracts and displays sections
- [x] LinkedChains shows associated chains
- [x] No TypeScript errors
