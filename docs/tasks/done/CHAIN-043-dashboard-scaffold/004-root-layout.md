# Task: Root Layout Integration

**Chain**: CHAIN-043-dashboard-scaffold  
**Task ID**: 004  
**Status**: done  
**Type**: impl  
**Linked CR**: CR-20251208-003  

---

## Objective

Update the root layout to integrate sidebar, header, and providers.

---

## Requirements

1. Update `src/app/layout.tsx`:
   - Wrap with ThemeProvider
   - Include Sidebar component
   - Include Header component
   - Main content area with proper spacing

2. Layout structure:
```
┌─────────────────────────────────────────────────────────────┐
│  Header (theme toggle, mobile menu)                         │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│   Sidebar    │   Main Content                               │
│   (fixed)    │   (scrollable)                               │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

3. Responsive behavior:
   - Desktop: Sidebar visible, fixed width
   - Mobile: Sidebar hidden, accessible via hamburger menu

---

## Acceptance Criteria

- [ ] Layout renders sidebar and header
- [ ] Main content scrolls independently
- [ ] Mobile layout hides sidebar
- [ ] Theme toggle works in header
- [ ] TRPCProvider still wraps content
- [ ] `pnpm build` passes

---

## Dependencies

- Task 002 (theme provider)
- Task 003 (layout components)
