# Change Request: Performance Web Dashboard

**ID**: CR-20251211-022  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Build the web dashboard for performance contracts: performance score overview, contract status, benchmark visualization, and regression alerts.

---

## Why

The web dashboard provides visibility into performance health without requiring CLI expertise. It enables:

- At-a-glance performance assessment
- Benchmark trend visualization
- Regression detection and alerting
- Contract configuration without editing YAML

---

## Scope

**In Scope**:
- `/performance` route — Overview with performance score
- `/performance/contracts` route — Contract status and violations
- `/performance/benchmarks` route — Benchmark results and trends
- `/performance/regressions` route — Detected regressions
- `/performance/config` route — Configuration UI
- tRPC router for performance operations
- Performance summary card on main dashboard
- Trust score integration

**Out of Scope**:
- Workflow integration (CR-20251211-023)
- Real-time profiling
- Flame graph visualization (future)

---

## Acceptance Criteria

- [ ] `/performance` shows performance score (0-100)
- [ ] Score breakdown by category (latency, memory, complexity)
- [ ] `/performance/contracts` lists all contracts with pass/fail status
- [ ] Contract violations shown with details
- [ ] `/performance/benchmarks` shows benchmark results
- [ ] Benchmark trend chart over time
- [ ] `/performance/regressions` highlights performance regressions
- [ ] Regression threshold configurable
- [ ] `/performance/config` allows threshold configuration
- [ ] Configuration changes persist to `.choragen/performance.yaml`
- [ ] Performance contributes to trust score
- [ ] tRPC router exposes all performance operations

---

## Affected Design Documents

- [Performance Contracts](../../../design/core/features/performance-contracts.md)
- [Web Chat Interface](../../../design/core/features/web-chat-interface.md)

---

## Linked ADRs

- ADR-011: Web API Architecture
- ADR-016: Performance Contracts

---

## Dependencies

- **CR-20251211-020**: Performance Core Infrastructure
- **CR-20251211-021**: Performance Advanced Contracts

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create:

```
packages/web/src/
├── app/performance/
│   ├── page.tsx                    # Overview dashboard
│   ├── contracts/
│   │   └── page.tsx                # Contract status
│   ├── benchmarks/
│   │   └── page.tsx                # Benchmark results
│   ├── regressions/
│   │   └── page.tsx                # Regression alerts
│   └── config/
│       └── page.tsx                # Configuration
├── components/performance/
│   ├── performance-score-card.tsx  # Score with breakdown
│   ├── contract-status-table.tsx   # Contract pass/fail
│   ├── benchmark-chart.tsx         # Trend visualization
│   ├── regression-alert.tsx        # Regression highlight
│   └── threshold-editor.tsx        # Configuration form
└── server/routers/
    └── performance.ts              # tRPC router
```

tRPC procedures:
- `performance.getSummary` — Score and breakdown
- `performance.getContracts` — Contract status
- `performance.getViolations` — Contract violations
- `performance.getBenchmarks` — Benchmark results
- `performance.getRegressions` — Detected regressions
- `performance.getConfig` — Current configuration
- `performance.updateConfig` — Update configuration

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
