# Task: Layout Components

**Chain**: CHAIN-043-dashboard-scaffold  
**Task ID**: 003  
**Status**: done  
**Type**: impl  
**Linked CR**: CR-20251208-003  

---

## Objective

Create the core layout components: sidebar navigation, header, and breadcrumbs.

---

## Requirements

### Sidebar (`src/components/layout/sidebar.tsx`)

```typescript
const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Chains', href: '/chains', icon: GitBranch },
  { name: 'Requests', href: '/requests', icon: FileText },
  { name: 'Sessions', href: '/sessions', icon: Bot },
  { name: 'Metrics', href: '/metrics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];
```

- Active link highlighting
- Collapsible on mobile (using Sheet component)
- Logo/brand at top

### Header (`src/components/layout/header.tsx`)

- Mobile menu trigger (hamburger)
- Theme toggle
- Breadcrumbs slot

### Breadcrumbs (`src/components/layout/breadcrumbs.tsx`)

- Auto-generate from pathname
- Clickable segments

---

## Acceptance Criteria

- [ ] Sidebar displays all navigation items
- [ ] Active route is highlighted
- [ ] Header contains theme toggle
- [ ] Mobile sidebar opens/closes via Sheet
- [ ] Breadcrumbs show current path
- [ ] Components are responsive
- [ ] `pnpm build` passes

---

## Dependencies

- Task 001 (shadcn/ui components)
- Task 002 (theme toggle)
