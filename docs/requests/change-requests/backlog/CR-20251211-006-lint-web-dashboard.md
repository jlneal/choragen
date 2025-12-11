# Change Request: Lint Web Dashboard

**ID**: CR-20251211-006  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Build the web dashboard for Universal Artifact Linting: artifact type browser, rule configuration UI, violation review interface, and trust score display.

---

## Why

The web dashboard is the primary interface for humans to interact with the linting system. It provides:

- Visibility into all artifact types and their rules
- Configuration without editing YAML files
- Violation review with filtering and batch operations
- Trust score visualization to assess project health
- The interface through which users describe rules (for agent encoding)

---

## Scope

**In Scope**:
- `/lint` route — Overview dashboard with trust score
- `/lint/artifacts` route — Artifact type registry browser
- `/lint/rules` route — Rule catalog with enable/disable/severity controls
- `/lint/violations` route — Current violations with filtering, grouping, details
- `/lint/history` route — Violation trends over time (basic)
- tRPC router for lint operations: `lint.scan`, `lint.getViolations`, `lint.getRules`, `lint.updateRule`, `lint.getArtifactTypes`, `lint.getTrustScore`
- Trust score card on main dashboard
- Rule configuration persistence to `.choragen/lint.yaml`

**Out of Scope**:
- Workflow gate integration (CR-20251211-007)
- Auto-fix UI (future enhancement)
- Rule creation wizard (future — agents create rules via chat)
- IDE integration / LSP

---

## Acceptance Criteria

- [ ] `/lint` shows trust score with breakdown by category
- [ ] `/lint/artifacts` lists all discovered artifact types with counts
- [ ] `/lint/artifacts/[type]` shows rules applicable to that type
- [ ] `/lint/rules` lists all rules with current severity settings
- [ ] Rules can be toggled (error/warning/off) from the UI
- [ ] Rule changes persist to `.choragen/lint.yaml`
- [ ] `/lint/violations` shows current violations with filtering
- [ ] Violations can be filtered by: artifact type, rule, severity, file path
- [ ] Violation detail shows file content with highlighted line
- [ ] `/lint/history` shows violation count trend (last 7 days minimum)
- [ ] Trust score appears on main dashboard as summary card
- [ ] tRPC router exposes all lint operations
- [ ] Scan can be triggered from UI with progress indicator

---

## Affected Design Documents

- [Universal Artifact Linting](../../../design/core/features/universal-artifact-linting.md)
- [Web Chat Interface](../../../design/core/features/web-chat-interface.md)

---

## Linked ADRs

- ADR-011: Web API Architecture
- ADR-012: Universal Artifact Linting

---

## Dependencies

- **CR-20251211-004**: Lint Core Infrastructure (needs lint engine)
- **CR-20251211-005**: Lint Source Integration (for complete coverage)

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create:

```
packages/web/src/
├── app/lint/
│   ├── page.tsx                    # Overview dashboard
│   ├── artifacts/
│   │   ├── page.tsx                # Artifact type list
│   │   └── [type]/page.tsx         # Single artifact type detail
│   ├── rules/
│   │   └── page.tsx                # Rule catalog
│   ├── violations/
│   │   └── page.tsx                # Violation browser
│   └── history/
│       └── page.tsx                # Trend view
├── components/lint/
│   ├── trust-score-card.tsx        # Trust score display
│   ├── artifact-type-card.tsx      # Artifact type summary
│   ├── rule-row.tsx                # Rule with severity toggle
│   ├── violation-card.tsx          # Violation detail
│   ├── violation-filters.tsx       # Filter controls
│   ├── scan-button.tsx             # Trigger scan with progress
│   └── trend-chart.tsx             # Violation trend visualization
└── server/routers/
    └── lint.ts                     # tRPC router
```

tRPC procedures:
- `lint.scan` — Trigger full or incremental scan, return violations
- `lint.getViolations` — Get cached violations with filters
- `lint.getRules` — Get all rules with current config
- `lint.updateRule` — Update rule severity, persist to config
- `lint.getArtifactTypes` — Get discovered artifact types
- `lint.getTrustScore` — Calculate and return trust score
- `lint.getHistory` — Get violation counts over time

Trust score calculation:
```typescript
score = (passingArtifacts / totalArtifacts) * 100
// Weighted: errors count as 0, warnings count as 0.5
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
