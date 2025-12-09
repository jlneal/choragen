# Change Request: Dashboard Scaffold

**ID**: CR-20251208-003  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-08  
**Owner**: control-agent  

---

## Summary

Create the foundational Next.js application structure with layout, navigation, theming, and core UI components for the Choragen web dashboard.

---

## Motivation

Before building individual features, we need:
- Consistent layout and navigation
- Design system with shadcn/ui components
- Dark/light theme support
- Responsive design foundation
- tRPC client integration

---

## Scope

**In Scope**:
- Next.js app router structure
- Root layout with sidebar navigation
- shadcn/ui component library setup
- Tailwind CSS configuration
- Dark/light theme toggle
- tRPC client provider
- Loading and error states
- Responsive design (desktop + tablet)

**Out of Scope**:
- Individual feature pages (separate CRs)
- Authentication UI
- Real-time features

---

## Proposed Changes

### Application Structure

```
packages/web/src/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Dashboard home
│   ├── chains/
│   │   ├── page.tsx            # Chain list (placeholder)
│   │   └── [id]/page.tsx       # Chain detail (placeholder)
│   ├── requests/
│   │   ├── page.tsx            # Request list (placeholder)
│   │   └── [id]/page.tsx       # Request detail (placeholder)
│   ├── sessions/
│   │   └── page.tsx            # Sessions (placeholder)
│   ├── metrics/
│   │   └── page.tsx            # Metrics (placeholder)
│   └── settings/
│       └── page.tsx            # Settings (placeholder)
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/
│   │   ├── sidebar.tsx         # Navigation sidebar
│   │   ├── header.tsx          # Top header
│   │   └── breadcrumbs.tsx     # Breadcrumb navigation
│   ├── theme-provider.tsx      # Dark/light theme
│   └── trpc-provider.tsx       # tRPC React Query provider
└── styles/
    └── globals.css             # Tailwind + custom styles
```

### Navigation Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Choragen                                    [Theme] [User] │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  Dashboard   │  Welcome to Choragen                         │
│  ─────────── │                                              │
│  Chains      │  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  Requests    │  │ Active  │ │ Pending │ │ Done    │        │
│  Sessions    │  │ Chains  │ │ Tasks   │ │ Today   │        │
│  Metrics     │  │   3     │ │   12    │ │   8     │        │
│  ─────────── │  └─────────┘ └─────────┘ └─────────┘        │
│  Settings    │                                              │
│              │  Recent Activity                             │
│              │  ├─ Task completed...                        │
│              │  └─ Chain created...                         │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 14.x |
| UI Components | shadcn/ui | latest |
| Styling | Tailwind CSS | 3.x |
| Icons | Lucide React | latest |
| State | React Query (via tRPC) | 5.x |
| Theme | next-themes | latest |

### Key Components

```typescript
// packages/web/src/components/layout/sidebar.tsx
const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Chains', href: '/chains', icon: GitBranch },
  { name: 'Requests', href: '/requests', icon: FileText },
  { name: 'Sessions', href: '/sessions', icon: Bot },
  { name: 'Metrics', href: '/metrics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];
```

---

## Acceptance Criteria

- [ ] Next.js 14 app with app router
- [ ] Sidebar navigation with all main routes
- [ ] Header with theme toggle
- [ ] shadcn/ui installed with Button, Card, Badge, etc.
- [ ] Dark/light theme working
- [ ] tRPC client provider configured
- [ ] Placeholder pages for all routes
- [ ] Responsive sidebar (collapsible on mobile)
- [ ] Loading skeleton components
- [ ] Error boundary with fallback UI
- [ ] `pnpm dev` starts dashboard on localhost:3000
- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes

---

## Dependencies

- CR-20251208-002 (Web API Server) - for tRPC client

---

## Linked Design Documents

- [Web Dashboard](../../design/core/features/web-dashboard.md)

---

## Commits

[Populated by `choragen request:close`]
