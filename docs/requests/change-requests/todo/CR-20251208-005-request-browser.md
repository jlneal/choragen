# Change Request: Request Browser

**ID**: CR-20251208-005  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-08  
**Owner**: control-agent  

---

## Summary

Implement the request (CR/FR) browser with list and detail views, showing request status, linked chains, and acceptance criteria progress.

---

## Motivation

Requests are the entry point for all work in Choragen. Users need to:
- See all pending, active, and completed requests
- Understand request status and progress
- View acceptance criteria completion
- Navigate to linked chains

---

## Scope

**In Scope**:
- Request list page with CR/FR tabs
- Request detail page with full content
- Status workflow visualization (todo → doing → done)
- Acceptance criteria checklist display
- Linked chains section
- Request metadata (dates, owner, domain)

**Out of Scope**:
- Creating/editing requests (Phase 2)
- Markdown editing
- Request templates

---

## Proposed Changes

### Request List Page

```
/requests
┌─────────────────────────────────────────────────────────────┐
│  Requests                          [CR] [FR] [Filter] [+]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Change Requests                                            │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ CR-20251208-001                              done   │   │
│  │ Interactive Agent Menu                              │   │
│  │ cli · 2025-12-08 · 6/6 criteria                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ CR-20251207-012                              todo   │   │
│  │ Web Dashboard                                       │   │
│  │ dashboard · 2025-12-07 · 0/5 criteria               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Fix Requests                                               │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  (No fix requests)                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Request Detail Page

```
/requests/CR-20251208-001
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Requests                                         │
│                                                             │
│  CR-20251208-001                                    done    │
│  Interactive Agent Menu                                     │
│  ─────────────────────────────────────────────────────────  │
│  Domain: cli · Created: 2025-12-08 · Owner: control-agent   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Summary                                                    │
│  ─────────────────────────────────────────────────────────  │
│  Add a menu-driven interactive interface for the agent      │
│  runtime, making it easy to start sessions...               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Acceptance Criteria                              6/6 ✓     │
│  ─────────────────────────────────────────────────────────  │
│  ✅ choragen agent launches interactive menu                │
│  ✅ Arrow key navigation with Enter to select               │
│  ✅ Start New Session wizard                                │
│  ✅ Resume Session browser                                  │
│  ✅ Settings persistence                                    │
│  ✅ Exit option                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Linked Chains                                              │
│  ─────────────────────────────────────────────────────────  │
│  → CHAIN-041-interactive-menu (done, 100%)                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Components

```typescript
// Request list components
RequestList        // Main list with tabs
RequestCard        // Individual request card
RequestTabs        // CR/FR tab switcher
RequestFilters     // Status, domain filters
RequestStatusBadge // Status indicator

// Request detail components
RequestHeader      // Title, metadata, status
RequestContent     // Markdown-rendered content
AcceptanceCriteria // Checklist with progress
LinkedChains       // List of associated chains
RequestTimeline    // Status history (future)
```

---

## Acceptance Criteria

- [ ] `/requests` page lists all requests
- [ ] Tabs to switch between CR and FR
- [ ] Request cards show: ID, title, domain, status, criteria progress
- [ ] Filter by status (todo, doing, done)
- [ ] Filter by domain
- [ ] Sort by date, status
- [ ] `/requests/[id]` shows request detail
- [ ] Render request content (What, Why, Scope sections)
- [ ] Display acceptance criteria with checkboxes
- [ ] Show linked chains with status
- [ ] Empty states for no requests
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
