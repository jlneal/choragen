# Task: Placeholder Pages

**Chain**: CHAIN-043-dashboard-scaffold  
**Task ID**: 005  
**Status**: done  
**Type**: impl  
**Linked CR**: CR-20251208-003  

---

## Objective

Create placeholder pages for all main routes with consistent structure.

---

## Requirements

Create the following pages with placeholder content:

### Routes to Create

| Route | File | Description |
|-------|------|-------------|
| `/chains` | `app/chains/page.tsx` | Chain list |
| `/chains/[id]` | `app/chains/[id]/page.tsx` | Chain detail |
| `/requests` | `app/requests/page.tsx` | Request list |
| `/requests/[id]` | `app/requests/[id]/page.tsx` | Request detail |
| `/sessions` | `app/sessions/page.tsx` | Sessions list |
| `/metrics` | `app/metrics/page.tsx` | Metrics dashboard |
| `/settings` | `app/settings/page.tsx` | Settings |

### Page Structure

Each page should have:
- Page title
- Brief description
- "Coming soon" or placeholder content
- Use Card component for consistent styling

### Update Home Page

Update `app/page.tsx` to:
- Use the new layout
- Show stat cards with placeholder data
- Include "Recent Activity" section (placeholder)

---

## Acceptance Criteria

- [ ] All routes are accessible
- [ ] Each page has title and description
- [ ] Pages use consistent Card styling
- [ ] Navigation links work correctly
- [ ] `pnpm build` passes

---

## Dependencies

- Task 001 (Card component)
- Task 004 (root layout)
