# Change Request: Documentation Quality Web Dashboard

**ID**: CR-20251211-026  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Build the web dashboard for documentation quality: quality scores, per-file analysis, issue browser, coverage metrics, and configuration UI.

---

## Why

The web dashboard provides visibility into documentation health without requiring CLI expertise. It enables:

- At-a-glance documentation quality assessment
- Per-file quality breakdown
- Issue tracking and resolution
- Documentation coverage gaps
- Configuration without editing YAML

---

## Scope

**In Scope**:
- `/docs/quality` route — Overview with quality scores
- `/docs/quality/files` route — Per-file quality analysis
- `/docs/quality/issues` route — All quality issues
- `/docs/quality/coverage` route — Documentation coverage
- `/docs/quality/config` route — Configuration UI
- tRPC router for doc quality operations
- Doc quality summary card on main dashboard
- Trust score integration

**Out of Scope**:
- Workflow integration (CR-20251211-027)
- Inline editing of documentation
- AI-powered rewriting suggestions

---

## Acceptance Criteria

- [ ] `/docs/quality` shows overall quality score (0-100)
- [ ] Score breakdown: completeness, clarity, consistency, accuracy
- [ ] `/docs/quality/files` lists all docs with quality scores
- [ ] Files sortable by score, type, path
- [ ] Files filterable by doc type, score range
- [ ] `/docs/quality/issues` shows all quality issues
- [ ] Issues filterable by category, severity, file
- [ ] Issue detail shows context and suggestion
- [ ] `/docs/quality/coverage` shows which code has docs
- [ ] Coverage by package, directory, file
- [ ] `/docs/quality/config` allows configuration
- [ ] Configuration changes persist to `.choragen/doc-quality.yaml`
- [ ] Doc quality contributes to trust score
- [ ] tRPC router exposes all doc quality operations

---

## Affected Design Documents

- [Documentation Quality](../../../design/core/features/documentation-quality.md)
- [Web Chat Interface](../../../design/core/features/web-chat-interface.md)

---

## Linked ADRs

- ADR-011: Web API Architecture
- ADR-017: Documentation Quality

---

## Dependencies

- **CR-20251211-024**: Documentation Quality Core Infrastructure
- **CR-20251211-025**: Documentation Clarity Analysis

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create:

```
packages/web/src/
├── app/docs/quality/
│   ├── page.tsx                    # Overview dashboard
│   ├── files/
│   │   └── page.tsx                # Per-file analysis
│   ├── issues/
│   │   └── page.tsx                # Issue browser
│   ├── coverage/
│   │   └── page.tsx                # Coverage metrics
│   └── config/
│       └── page.tsx                # Configuration
├── components/docs/
│   ├── quality-score-card.tsx      # Score with breakdown
│   ├── file-quality-table.tsx      # Per-file scores
│   ├── issue-list.tsx              # Issue browser
│   ├── coverage-chart.tsx          # Coverage visualization
│   └── terminology-checker.tsx     # Consistency issues
└── server/routers/
    └── doc-quality.ts              # tRPC router
```

tRPC procedures:
- `docQuality.getSummary` — Overall quality scores
- `docQuality.getFiles` — Per-file analysis
- `docQuality.getFile` — Single file detail
- `docQuality.getIssues` — All issues with filters
- `docQuality.getCoverage` — Coverage metrics
- `docQuality.getConfig` — Current configuration
- `docQuality.updateConfig` — Update configuration

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
