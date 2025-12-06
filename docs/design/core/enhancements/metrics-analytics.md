# Enhancement: Metrics and Analytics

**Domain**: core  
**Status**: proposed  
**Priority**: medium  
**Created**: 2025-12-06  

---

## Description

Track and analyze task chain metrics including velocity, completion rates, cycle times, and agent performance. Provides data-driven insights for process improvement.

---

## Motivation

- **Velocity tracking**: Understand team throughput over time
- **Bottleneck identification**: Find where tasks get stuck
- **Agent performance**: Compare human vs AI agent efficiency
- **Process improvement**: Data-driven workflow optimization
- **Estimation accuracy**: Compare estimates to actuals for better planning

---

## Proposed Solution

### Core Metrics

| Metric | Description |
|--------|-------------|
| Cycle Time | Time from task start to completion |
| Lead Time | Time from task creation to completion |
| Throughput | Tasks completed per time period |
| WIP | Work in progress at any point |
| Rework Rate | Percentage of tasks sent back for rework |
| Block Rate | Percentage of tasks that get blocked |

### Agent-Specific Metrics

| Metric | Description |
|--------|-------------|
| Tasks per Agent | Distribution of work across agents |
| First-Pass Rate | Tasks approved without rework |
| Context Size | Average task file size |
| Handoff Efficiency | Time between task transitions |

### Architecture

```
packages/core/src/metrics/
├── collector.ts      # Collect metrics from task transitions
├── aggregator.ts     # Aggregate metrics over time periods
├── storage.ts        # Persist metrics data
└── reporter.ts       # Generate reports and exports
```

### Data Storage

```yaml
# .choragen/metrics/2025-12.yaml
period: 2025-12
chains:
  CHAIN-001:
    tasks_completed: 5
    avg_cycle_time: 2.3h
    rework_rate: 0.2
    
agents:
  impl-agent-1:
    tasks_completed: 12
    first_pass_rate: 0.83
```

### CLI Commands

| Command | Description |
|---------|-------------|
| `choragen metrics:summary` | Show current period summary |
| `choragen metrics:chain <id>` | Show metrics for specific chain |
| `choragen metrics:export` | Export metrics to CSV/JSON |
| `choragen metrics:trends` | Show trends over time |

---

## Dependencies

- **Task Chain Management**: Must track task transitions
- **Governance Enforcement**: For compliance metrics
- **File Locking**: For concurrent metric updates

---

## Open Questions

1. **Storage Format**: YAML files vs SQLite for metrics storage?
2. **Privacy**: How to handle agent identification in shared repos?
3. **Retention**: How long to keep historical metrics?
4. **Real-time vs Batch**: Collect metrics on each transition or batch process?

---

## Related Documents

- [Task Chain Management](../features/task-chain-management.md)
- [Dashboard UI](./dashboard-ui.md)
- [Team Lead Persona](../personas/team-lead.md)

---

## Acceptance Criteria

- [ ] Metrics collected on each task transition
- [ ] Summary command shows current period metrics
- [ ] Chain-specific metrics available
- [ ] Export to CSV/JSON supported
- [ ] Historical trends viewable
