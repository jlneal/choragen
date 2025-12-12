# Task: Build role list page (/roles)

**Chain**: CHAIN-064-role-based-tool-access  
**Task**: 011-011-role-list-page  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Create a web page that displays all roles with their tool counts, allowing users to navigate to individual role editors and create new roles.

---

## Expected Files

- `packages/web/src/app/roles/page.tsx - Role list page`
- `packages/web/src/components/roles/role-card.tsx - Role card component (optional)`

---

## Acceptance Criteria

- [ ] Page displays all roles from roleRouter.list
- [ ] Each role shows:
- [ ] - Name
- [ ] - ID (slug)
- [ ] - Tool count
- [ ] - Created/updated timestamps
- [ ] "Create Role" button navigates to /roles/new
- [ ] Clicking a role navigates to /roles/[id]
- [ ] Loading and error states handled
- [ ] Responsive design (works on mobile)
- [ ] pnpm build passes
- [ ] pnpm lint passes

---

## Constraints

- Use existing UI patterns from other list pages in the web package
- Use shadcn/ui components where available
- Use TailwindCSS for styling

---

## Notes

Check existing pages like workflows or chains for patterns on data fetching and layout.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
