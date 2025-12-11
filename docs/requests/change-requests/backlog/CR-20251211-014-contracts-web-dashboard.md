# Change Request: Contracts Web Dashboard

**ID**: CR-20251211-014  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Build the web dashboard for runtime contracts: violation monitoring, contract browser, coverage visualization, configuration UI, and real-time violation streaming.

---

## Why

The web dashboard is the primary interface for humans to interact with contract data. It provides:

- Real-time visibility into contract violations
- Configuration without editing YAML files
- Contract coverage to identify unprotected code
- Historical trends to track improvement
- Integration with the overall trust score

---

## Scope

**In Scope**:
- `/contracts` route — Overview dashboard with violation summary
- `/contracts/list` route — All contracts with status and configuration
- `/contracts/violations` route — Violation browser with filtering
- `/contracts/coverage` route — Contract coverage by file/function
- `/contracts/config` route — Contract configuration UI
- `/contracts/live` route — Real-time violation monitor
- tRPC router for contract operations
- WebSocket/SSE for real-time violation streaming
- Contract summary card on main dashboard
- Trust score integration

**Out of Scope**:
- Workflow gate integration (CR-20251211-015)
- Contract generation wizard (future enhancement)
- Violation alerting (Slack, email — future)

---

## Acceptance Criteria

- [ ] `/contracts` shows violation summary with trend
- [ ] `/contracts/list` lists all contracts with enable/disable toggles
- [ ] Contracts filterable by type (precondition, postcondition, invariant, schema)
- [ ] `/contracts/violations` shows violations with full context
- [ ] Violations filterable by: contract, file, time range, severity
- [ ] Violation detail shows stack trace and reproduction context
- [ ] `/contracts/coverage` shows which functions have contracts
- [ ] `/contracts/config` allows mode configuration per contract
- [ ] Configuration changes persist to `.choragen/contracts.yaml`
- [ ] `/contracts/live` streams violations in real-time
- [ ] Contract score contributes to trust score on main dashboard
- [ ] tRPC router exposes all contract operations

---

## Affected Design Documents

- [Runtime Contract Enforcement](../../../design/core/features/runtime-contract-enforcement.md)
- [Web Chat Interface](../../../design/core/features/web-chat-interface.md)

---

## Linked ADRs

- ADR-011: Web API Architecture
- ADR-014: Runtime Contract Enforcement

---

## Dependencies

- **CR-20251211-012**: Contracts Core Infrastructure
- **CR-20251211-013**: Schema Contracts

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create:

```
packages/web/src/
├── app/contracts/
│   ├── page.tsx                    # Overview dashboard
│   ├── list/
│   │   └── page.tsx                # Contract browser
│   ├── violations/
│   │   └── page.tsx                # Violation browser
│   ├── coverage/
│   │   └── page.tsx                # Coverage visualization
│   ├── config/
│   │   └── page.tsx                # Configuration
│   └── live/
│       └── page.tsx                # Real-time monitor
├── components/contracts/
│   ├── violation-summary-card.tsx  # Summary metrics
│   ├── contract-list.tsx           # Contract browser
│   ├── violation-card.tsx          # Violation detail
│   ├── violation-timeline.tsx      # Violations over time
│   ├── coverage-heatmap.tsx        # Coverage visualization
│   ├── mode-toggle.tsx             # Enforce/log/skip toggle
│   └── live-monitor.tsx            # Real-time stream
└── server/routers/
    └── contracts.ts                # tRPC router
```

tRPC procedures:
- `contracts.list` — All contracts with status
- `contracts.getViolations` — Violations with filters
- `contracts.getViolation` — Single violation detail
- `contracts.getCoverage` — Contract coverage metrics
- `contracts.getConfig` — Current configuration
- `contracts.updateConfig` — Update contract modes
- `contracts.onViolation` — Subscription for real-time violations

Real-time implementation:
- Use tRPC subscriptions with WebSocket
- Fallback to SSE if WebSocket unavailable
- Buffer violations to prevent UI flooding

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
