# Task: Theme Provider

**Chain**: CHAIN-043-dashboard-scaffold  
**Task ID**: 002  
**Status**: done  
**Type**: impl  
**Linked CR**: CR-20251208-003  

---

## Objective

Implement dark/light theme support using next-themes.

---

## Requirements

1. Install `next-themes` package
2. Create `src/components/theme-provider.tsx` wrapping `ThemeProvider`
3. Create `src/components/theme-toggle.tsx` with dropdown menu
4. Update root layout to include ThemeProvider
5. Ensure CSS variables in `globals.css` support both themes

---

## Acceptance Criteria

- [ ] Theme toggle component exists
- [ ] Dark mode works correctly
- [ ] Light mode works correctly
- [ ] Theme persists across page refreshes
- [ ] No flash of wrong theme on load
- [ ] `pnpm build` passes

---

## Dependencies

- Task 001 (shadcn/ui setup for DropdownMenu)

---

## Notes

- Use `attribute="class"` for Tailwind dark mode
- Default to system preference
