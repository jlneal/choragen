# Task: Implement metrics:summary Command

**ID**: 005-metrics-summary  
**Chain**: CHAIN-031-pipeline-metrics  
**Status**: todo  
**Agent**: impl  

---

## Objective

Implement `choragen metrics:summary` to display key pipeline metrics.

## Command Specification

```bash
choragen metrics:summary [--since <duration>] [--chain <id>]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--since` | Time window (7d, 30d, 90d) | all time |
| `--chain` | Filter to specific chain | all chains |

### Output Format

```
Pipeline Metrics (last 30 days)
═══════════════════════════════════════════════════════════

Tasks
  Completed:        47
  Avg Cycle Time:   2.4 hours
  P50 Cycle Time:   1.8 hours
  P90 Cycle Time:   5.2 hours

Quality
  Rework Rate:      12.8% (6/47)
  First-Time-Right: 87.2%
  Avg Rework Iterations: 1.2

Chains
  Completed:        8
  Active:           2
  Avg Duration:     3.2 days

Requests
  Closed:           12
  Avg Cycle Time:   4.1 days

Tokens (where tracked)
  Total Input:      125,000
  Total Output:     48,000
  Avg per Task:     3,680

Models Used
  claude-3.5-sonnet: 42 tasks
  claude-3-opus:     5 tasks
```

## Implementation

1. Load events from MetricsCollector
2. Calculate aggregates
3. Format and display

## Files to Create/Modify

- Create: `packages/cli/src/commands/metrics-summary.ts`
- Modify: `packages/cli/src/cli.ts` - register command

## Acceptance Criteria

- [ ] Command displays task metrics
- [ ] Command displays quality metrics (rework)
- [ ] Command displays chain/request metrics
- [ ] Command displays token summary (when available)
- [ ] `--since` filters by time window
- [ ] `--chain` filters to specific chain
- [ ] Handles empty metrics gracefully
