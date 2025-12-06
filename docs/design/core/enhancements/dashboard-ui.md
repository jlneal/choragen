# Enhancement: Dashboard UI

**Domain**: core  
**Status**: proposed  
**Priority**: medium  
**Created**: 2025-12-06  

---

## Description

A web-based dashboard for visualizing task chains, governance status, and project health. Provides a bird's-eye view for team leads and stakeholders who need visibility without diving into the codebase.

---

## Motivation

- **Team visibility**: Non-developers can track progress without IDE access
- **Project health**: Aggregate metrics across multiple chains
- **Historical view**: See completed work and velocity trends
- **Governance compliance**: Visual indicators for policy violations
- **Stakeholder reporting**: Export-ready views for status updates

---

## Proposed Solution

### Core Features

| Feature | Description |
|---------|-------------|
| Chain Overview | List all chains with progress indicators |
| Kanban Board | Drag-and-drop task management |
| Timeline View | Gantt-style view of task dependencies |
| Governance Dashboard | Policy compliance status |
| Activity Feed | Recent task transitions and commits |

### Architecture

```
dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Overview
│   │   ├── chains/
│   │   │   └── [id]/page.tsx  # Chain detail
│   │   └── governance/
│   │       └── page.tsx       # Governance status
│   ├── components/
│   │   ├── ChainCard.tsx
│   │   ├── TaskBoard.tsx
│   │   └── ActivityFeed.tsx
│   └── lib/
│       └── api.ts             # Choragen API client
├── package.json
└── README.md
```

### Technology Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **State**: React Query for server state
- **Charts**: Recharts for metrics visualization

### Deployment Options

1. **Local**: `choragen dashboard` starts local server
2. **Self-hosted**: Docker container for team deployment
3. **Static Export**: Generate static site for read-only view

---

## Dependencies

- **@choragen/core**: Must expose read APIs
- **Task Chain Management**: Feature must be complete
- **Metrics and Analytics**: Enhancement for full metrics support

---

## Open Questions

1. **Authentication**: How to handle auth for team deployments?
2. **Real-time Updates**: WebSocket vs polling for live updates?
3. **Write Operations**: Should dashboard allow task transitions or be read-only?
4. **Multi-project**: Support viewing multiple repos in one dashboard?

---

## Related Documents

- [Task Chain Management](../features/task-chain-management.md)
- [Team Lead Persona](../personas/team-lead.md)
- [Metrics and Analytics](./metrics-analytics.md)

---

## Acceptance Criteria

- [ ] Dashboard displays all chains and their status
- [ ] Kanban board shows tasks by status
- [ ] Activity feed shows recent transitions
- [ ] Governance status is visible
- [ ] Dashboard can be run locally via CLI command
