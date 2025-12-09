# Change Request: Chain & Task Viewer

**ID**: CR-20251208-004  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-08  
**Owner**: control-agent  

---

## Summary

Implement the chain list and detail views, including task visualization with status, progress tracking, and chain history.

---

## Motivation

Chains and tasks are the core workflow units in Choragen. Users need to:
- See all chains at a glance with progress
- Drill into chain details to see tasks
- Understand task status and flow
- View chain history and activity

---

## Scope

**In Scope**:
- Chain list page with filtering and sorting
- Chain detail page with task list
- Task status visualization (backlog → todo → in-progress → in-review → done)
- Progress bars and completion percentages
- Chain metadata (request link, type, dates)
- Task detail modal/panel

**Out of Scope**:
- Creating/editing chains (Phase 2)
- Task transitions (Phase 2)
- Real-time updates

---

## Proposed Changes

### Chain List Page

```
/chains
┌─────────────────────────────────────────────────────────────┐
│  Chains                                    [Filter] [Sort]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ CHAIN-041-interactive-menu              [impl] done │   │
│  │ CR-20251208-001 · 6 tasks · 100%                    │   │
│  │ ████████████████████████████████████████            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ CHAIN-040-production-hardening          [impl] todo │   │
│  │ CR-20251207-009 · 4 tasks · 25%                     │   │
│  │ ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Chain Detail Page

```
/chains/CHAIN-041-interactive-menu
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Chains                                           │
│                                                             │
│  CHAIN-041-interactive-menu                                 │
│  Interactive Agent Menu                                     │
│  ─────────────────────────────────────────────────────────  │
│  Type: implementation · Request: CR-20251208-001            │
│  Created: 2025-12-08 · Status: done · Progress: 100%        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Tasks                                                      │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ✅ 001-menu-scaffold                              done     │
│  ✅ 002-main-menu-navigation                       done     │
│  ✅ 003-start-session-wizard                       done     │
│  ✅ 004-session-browser                            done     │
│  ✅ 005-settings-persistence                       done     │
│  ✅ 006-integration-tests                          done     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Components

```typescript
// Chain list components
ChainList          // Main list with filtering
ChainCard          // Individual chain card
ChainProgress      // Progress bar component
ChainFilters       // Status, type, date filters

// Chain detail components
ChainHeader        // Title, metadata, status
TaskList           // List of tasks
TaskRow            // Individual task with status
TaskStatusBadge    // Status indicator
TaskDetailPanel    // Slide-out panel for task details
```

---

## Acceptance Criteria

- [ ] `/chains` page lists all chains
- [ ] Chain cards show: ID, title, type, request, progress, status
- [ ] Filter chains by status (todo, in-progress, done)
- [ ] Filter chains by type (design, implementation)
- [ ] Sort chains by date, progress, name
- [ ] `/chains/[id]` shows chain detail with tasks
- [ ] Task list shows all tasks with status badges
- [ ] Click task opens detail panel with full info
- [ ] Progress bar accurately reflects task completion
- [ ] Link to associated request works
- [ ] Empty states for no chains/tasks
- [ ] Loading skeletons while fetching
- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes

---

## Dependencies

- CR-20251208-002 (Web API Server)
- CR-20251208-003 (Dashboard Scaffold)

---

## Linked Design Documents

- [Web Dashboard](../../design/core/features/web-dashboard.md)

---

## Commits

[Populated by `choragen request:close`]
