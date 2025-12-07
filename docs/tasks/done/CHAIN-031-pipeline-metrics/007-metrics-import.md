# Task: Implement metrics:import for Git History

**ID**: 007-metrics-import  
**Chain**: CHAIN-031-pipeline-metrics  
**Status**: todo  
**Agent**: impl  

---

## Objective

Implement `choragen metrics:import` to reconstruct historical metrics from git history.

## Command Specification

```bash
choragen metrics:import [--since <date>] [--dry-run]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--since` | Start date for import | repo creation |
| `--dry-run` | Show what would be imported | false |

### Import Strategy

1. **Parse git log** for commits with CR/FR references
2. **Scan task files** for status changes in git history
3. **Reconstruct events** from file modifications

### Event Reconstruction

| Git Signal | Event |
|------------|-------|
| Task file created | `task:started` (approx) |
| Task moved to `done/` | `task:completed` |
| Rework task created | `task:rework` |
| Chain directory created | `chain:created` |
| Request moved to `done/` | `request:closed` |

### Limitations

- Timestamps are commit times (may not match actual work time)
- Token counts unavailable for historical data
- Model info unavailable unless in commit message

### Output

```
Importing metrics from git history...

Found:
  - 12 chain:created events
  - 47 task:started events
  - 45 task:completed events
  - 6 task:rework events
  - 10 request:closed events

Import 120 events? [y/N]
```

## Files to Create/Modify

- Create: `packages/cli/src/commands/metrics-import.ts`
- Modify: `packages/cli/src/cli.ts` - register command

## Acceptance Criteria

- [ ] Parses git history for task/chain/request changes
- [ ] Reconstructs events with commit timestamps
- [ ] `--dry-run` shows preview without writing
- [ ] Handles missing data gracefully
- [ ] Avoids duplicate events on re-import
