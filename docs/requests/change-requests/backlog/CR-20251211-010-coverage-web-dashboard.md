# Change Request: Coverage Web Dashboard

**ID**: CR-20251211-010  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Build the web dashboard for test coverage: overview metrics, file browser with coverage highlighting, test inventory, gap analysis, threshold configuration, and trend visualization.

---

## Why

The web dashboard is the primary interface for humans to interact with coverage data. It provides:

- At-a-glance coverage health assessment
- Drill-down into specific files and uncovered lines
- Configuration without editing YAML files
- Visual identification of coverage gaps
- Trend tracking to ensure coverage improves over time
- Integration with the overall trust score

---

## Scope

**In Scope**:
- `/coverage` route — Overview dashboard with summary metrics
- `/coverage/files` route — File-level coverage browser
- `/coverage/files/[path]` route — Single file with line-by-line highlighting
- `/coverage/tests` route — Test inventory with metadata
- `/coverage/gaps` route — Prioritized uncovered code
- `/coverage/trends` route — Coverage trends over time
- `/coverage/config` route — Threshold configuration UI
- tRPC router for coverage operations
- Coverage summary card on main dashboard
- Trust score integration (coverage contributes to score)

**Out of Scope**:
- Workflow gate integration (CR-20251211-011)
- Test execution from UI (use CLI/IDE)
- Real-time coverage during test runs

---

## Acceptance Criteria

- [ ] `/coverage` shows overall coverage metrics (lines, branches, functions, statements)
- [ ] Coverage summary includes pass/fail status against thresholds
- [ ] `/coverage/files` lists all files with coverage percentages
- [ ] Files sortable by coverage %, name, path
- [ ] Files filterable by package, directory, threshold status
- [ ] `/coverage/files/[path]` shows source with line-by-line coverage
- [ ] Covered lines highlighted green, uncovered red
- [ ] Branch coverage shown inline (partial coverage indicators)
- [ ] `/coverage/tests` shows test inventory with source mappings
- [ ] `/coverage/gaps` lists uncovered code prioritized by importance
- [ ] `/coverage/trends` shows coverage over time (last 30 days)
- [ ] `/coverage/config` allows threshold configuration
- [ ] Threshold changes persist to `.choragen/coverage.yaml`
- [ ] Coverage contributes to trust score on main dashboard
- [ ] tRPC router exposes all coverage operations

---

## Affected Design Documents

- [Test Coverage Dashboard](../../../design/core/features/test-coverage-dashboard.md)
- [Web Chat Interface](../../../design/core/features/web-chat-interface.md)

---

## Linked ADRs

- ADR-011: Web API Architecture
- ADR-013: Test Coverage Dashboard

---

## Dependencies

- **CR-20251211-008**: Coverage Core Infrastructure
- **CR-20251211-009**: Test Inventory and Mapping

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create:

```
packages/web/src/
├── app/coverage/
│   ├── page.tsx                    # Overview dashboard
│   ├── files/
│   │   ├── page.tsx                # File browser
│   │   └── [...path]/page.tsx      # Single file view
│   ├── tests/
│   │   └── page.tsx                # Test inventory
│   ├── gaps/
│   │   └── page.tsx                # Gap analysis
│   ├── trends/
│   │   └── page.tsx                # Trend visualization
│   └── config/
│       └── page.tsx                # Configuration
├── components/coverage/
│   ├── coverage-summary-card.tsx   # Summary metrics
│   ├── coverage-bar.tsx            # Visual coverage bar
│   ├── file-coverage-table.tsx     # File list with metrics
│   ├── source-viewer.tsx           # Code with coverage highlighting
│   ├── coverage-heatmap.tsx        # Directory heatmap
│   ├── gap-list.tsx                # Uncovered code list
│   ├── trend-chart.tsx             # Coverage over time
│   └── threshold-editor.tsx        # Threshold configuration
└── server/routers/
    └── coverage.ts                 # tRPC router
```

tRPC procedures:
- `coverage.getSummary` — Overall coverage metrics
- `coverage.getFiles` — File list with coverage
- `coverage.getFile` — Single file with line coverage
- `coverage.getTests` — Test inventory
- `coverage.getGaps` — Uncovered code
- `coverage.getTrends` — Historical data
- `coverage.getConfig` — Current thresholds
- `coverage.updateConfig` — Update thresholds

Source viewer highlighting:
- Use Monaco or CodeMirror with custom decorations
- Green background for covered lines
- Red background for uncovered lines
- Yellow for partially covered branches

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
