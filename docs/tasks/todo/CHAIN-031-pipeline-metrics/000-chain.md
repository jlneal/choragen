# Chain: CHAIN-031-pipeline-metrics

**Request**: CR-20251207-011  
**Created**: 2025-12-07  
**Status**: todo  

---

## Objective

Add a metrics subsystem to track performance across the pipeline: tasks, chains, requests. Local-first storage (JSONL), with CLI commands to view and export metrics.

## Key Decisions

- **Token tracking**: Manual entry for now (automation as future CR)
- **Agent identity**: Track by model name (e.g., `claude-3.5-sonnet`)
- **Granularity**: Start/complete milestones for tasks
- **Historical**: Support import from git history

## Tasks

| ID | Title | Status | Agent |
|----|-------|--------|-------|
| 001 | Create ADR for metrics model | todo | impl |
| 002 | Define event types and storage | todo | impl |
| 003 | Implement MetricsCollector in core | todo | impl |
| 004 | Add event emission to CLI commands | todo | impl |
| 005 | Implement metrics:summary command | todo | impl |
| 006 | Implement metrics:export command | todo | impl |
| 007 | Implement metrics:import for git history | todo | impl |
| 008 | Seed this project's historical data | todo | impl |
| 009 | Verify and close | todo | control |

## Acceptance Criteria

- [ ] Events logged to `.choragen/metrics/events.jsonl`
- [ ] `metrics:summary` shows key metrics (cycle time, rework rate, throughput)
- [ ] `metrics:export` outputs JSON/CSV
- [ ] `metrics:import` populates from git history
- [ ] Token tracking via manual `--tokens` flag
- [ ] Model tracking via `--model` flag
- [ ] This project has seeded historical metrics
