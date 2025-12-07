# Task: Seed This Project's Historical Data

**ID**: 008-seed-historical  
**Chain**: CHAIN-031-pipeline-metrics  
**Status**: todo  
**Agent**: impl  

---

## Objective

Run `metrics:import` on this repository to populate historical metrics, demonstrating the system works and providing baseline data.

## Steps

1. Run `choragen metrics:import --dry-run` to preview
2. Review the discovered events
3. Run `choragen metrics:import` to populate
4. Run `choragen metrics:summary` to verify
5. Commit the populated metrics

## Expected Data

Based on current project state:

- ~30 chains created
- ~150+ tasks completed
- ~10 rework events
- ~15 requests closed

## Verification

After import, `metrics:summary` should show:

- Non-zero task counts
- Calculated cycle times
- Rework rate (should be low, ~5-10%)
- Chain completion data

## Deliverable

- `.choragen/metrics/events.jsonl` populated with historical data
- Commit with message referencing CR-20251207-011

## Acceptance Criteria

- [ ] `metrics:import` run successfully
- [ ] `metrics:summary` shows meaningful data
- [ ] Events file committed to repo
- [ ] No obvious data quality issues
