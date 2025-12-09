# Task: shadcn/ui Setup

**Chain**: CHAIN-043-dashboard-scaffold  
**Task ID**: 001  
**Status**: done  
**Type**: impl  
**Linked CR**: CR-20251208-003  

---

## Objective

Install and configure shadcn/ui component library with required base components.

---

## Requirements

1. Install shadcn/ui CLI and initialize
2. Configure `components.json` for the project
3. Install base components:
   - Button
   - Card
   - Badge
   - Skeleton
   - Separator
   - Sheet (for mobile sidebar)
   - DropdownMenu (for theme toggle)
4. Ensure Tailwind CSS variables are properly configured in `globals.css`

---

## Acceptance Criteria

- [ ] `components.json` exists with correct paths
- [ ] `src/components/ui/` contains installed components
- [ ] Components use CSS variables for theming
- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes

---

## Notes

- Use the `new-york` style variant
- Ensure path aliases match existing `@/` configuration
