# Task: Implement metrics:export Command

**ID**: 006-metrics-export  
**Chain**: CHAIN-031-pipeline-metrics  
**Status**: todo  
**Agent**: impl  

---

## Objective

Implement `choragen metrics:export` to export metrics data for external analysis.

## Command Specification

```bash
choragen metrics:export --format <json|csv> [--output <file>] [--since <duration>]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--format` | Output format | json |
| `--output` | Output file | stdout |
| `--since` | Time window | all time |

### JSON Output

```json
{
  "exportedAt": "2025-12-07T22:30:00Z",
  "period": {
    "since": "2025-11-07T00:00:00Z",
    "until": "2025-12-07T22:30:00Z"
  },
  "summary": {
    "tasks": { "completed": 47, "avgCycleTimeMs": 8640000 },
    "quality": { "reworkRate": 0.128, "firstTimeRight": 0.872 },
    "tokens": { "totalInput": 125000, "totalOutput": 48000 }
  },
  "events": [
    { "id": "...", "timestamp": "...", "eventType": "task:completed", ... }
  ]
}
```

### CSV Output

For events:
```csv
id,timestamp,eventType,entityType,entityId,chainId,requestId,model,tokensInput,tokensOutput
abc123,2025-12-07T10:00:00Z,task:completed,task,003-impl,CHAIN-031,CR-011,claude-3.5-sonnet,5000,2000
```

## Files to Create/Modify

- Create: `packages/cli/src/commands/metrics-export.ts`
- Modify: `packages/cli/src/cli.ts` - register command

## Acceptance Criteria

- [ ] JSON export includes summary and events
- [ ] CSV export includes all event fields
- [ ] `--output` writes to file
- [ ] stdout works for piping
- [ ] `--since` filters events
