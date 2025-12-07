# Change Request: Web Dashboard

**ID**: CR-20251207-012  
**Domain**: dashboard  
**Status**: todo  
**Created**: 2025-12-07  
**Owner**: agent  

---

## Summary

Create a standalone web application for monitoring and controlling the Choragen pipeline. Provides visual dashboards, real-time status, and eventually full request/chain/task management.

## Motivation

CLI-only interface limits:
- Real-time monitoring (must poll manually)
- Visual pipeline overview
- Non-technical stakeholder access
- Multi-chain coordination visibility

A web dashboard enables:
- At-a-glance pipeline health
- Historical trend visualization
- Future: create/manage requests without CLI
- Future: agent assignment and monitoring

## Proposed Changes

### New Package

```
packages/
└── dashboard/
    ├── src/
    │   ├── app/              # Next.js app router
    │   ├── components/       # React components
    │   └── lib/              # API client, utils
    ├── package.json
    └── README.md
```

### Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 14 | App router, API routes, SSR |
| UI | React + Tailwind + shadcn/ui | Modern, consistent with guidelines |
| Charts | Recharts or Chart.js | Metrics visualization |
| State | React Query | Server state management |
| Icons | Lucide | Per project conventions |

### Pages (Phase 1)

| Route | Purpose |
|-------|---------|
| `/` | Dashboard overview (active chains, recent activity) |
| `/metrics` | Metrics dashboard (from CR-011) |
| `/chains` | Chain list and status |
| `/chains/[id]` | Chain detail with task list |
| `/requests` | Request list (CR/FR) |
| `/requests/[id]` | Request detail |

### API Layer

Dashboard reads from local `.choragen/` directory and `docs/` structure:

```typescript
// packages/dashboard/src/lib/api.ts
export async function getChains(): Promise<Chain[]>
export async function getChain(id: string): Promise<ChainDetail>
export async function getMetrics(options: MetricsOptions): Promise<Metrics>
export async function getRequests(type?: 'cr' | 'fr'): Promise<Request[]>
```

Initially read-only. Write operations (create request, start task) in Phase 2.

### Dashboard Components

```
┌─────────────────────────────────────────────────────────────┐
│  Choragen Dashboard                              [Settings] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Active      │  │ Rework      │  │ Avg Cycle   │         │
│  │ Chains: 3   │  │ Rate: 12%   │  │ Time: 2.4h  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  Recent Activity                                            │
│  ├─ ✅ Task 003 completed (CHAIN-029)         2 min ago    │
│  ├─ 🔄 Task 001 started (CHAIN-030)           15 min ago   │
│  └─ 📝 FR-20251207-006 closed                 1 hour ago   │
│                                                             │
│  Active Chains                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ CHAIN-030-metrics  ████████░░░░  4/6 tasks  CR-011   │  │
│  │ CHAIN-029-rework   ██████████░░  5/6 tasks  CR-010   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Phases

### Phase 1: Read-Only Dashboard
- View chains, tasks, requests
- Metrics visualization
- Activity feed

### Phase 2: Control Plane
- Create requests
- Start/complete tasks
- Trigger rework

### Phase 3: Agent Management
- Agent status
- Task assignment
- Performance comparison

## Affected Components

| Component | Change |
|-----------|--------|
| New: `@choragen/dashboard` | Entire package |
| `@choragen/core` | May need to export types |

## Acceptance Criteria (Phase 1)

- [ ] Dashboard shows active chains with progress
- [ ] Metrics page displays key metrics from CR-011
- [ ] Chain detail shows task list with status
- [ ] Request list shows CR/FR with status
- [ ] Responsive design (desktop + tablet)

## Dependencies

- CR-20251207-011 (Pipeline Metrics) - for metrics data

## Design Docs

- `docs/design/core/features/web-dashboard.md` (to be created)

## ADR Required

Yes - ADR for dashboard tech stack and API design

---

## Commits

[Populated by `choragen request:close`]
