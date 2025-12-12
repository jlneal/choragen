# Task: Build tools viewer page (/tools)

**Chain**: CHAIN-064-role-based-tool-access  
**Task**: 013-013-tools-viewer-page  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Create a read-only web page that displays all available tools grouped by category, showing their metadata and which roles have access to each tool.

---

## Expected Files

- `packages/web/src/app/tools/page.tsx - Tools viewer page`
- `packages/web/src/components/tools/tool-card.tsx - Tool card component (optional)`

---

## Acceptance Criteria

- [ ] Page displays all tools from toolRouter.list
- [ ] Tools grouped by category with collapsible sections
- [ ] Each tool shows:
- [ ] - Name (humanized)
- [ ] - ID (snake_case)
- [ ] - Description
- [ ] - Category
- [ ] - Mutates flag (badge)
- [ ] - Roles that include this tool
- [ ] "Sync Tools" button calls toolRouter.sync to refresh metadata
- [ ] Search/filter by tool name or category
- [ ] Loading and error states handled
- [ ] pnpm build passes
- [ ] pnpm lint passes

---

## Constraints

- Read-only page (no editing tools directly)
- Use existing UI patterns from other pages
- Use shadcn/ui components (Accordion, Card, Badge, Input)

---

## Notes

The "Roles that include this tool" requires cross-referencing with role data. Consider fetching both tools and roles, then computing the relationship client-side.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
