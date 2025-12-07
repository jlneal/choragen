# Task: Verify and Close

**ID**: 009-verify-close  
**Chain**: CHAIN-031-pipeline-metrics  
**Status**: todo  
**Agent**: control  

---

## Objective

Verify the pipeline metrics implementation and close CR-20251207-011.

## Verification Checklist

### ADR
- [ ] ADR-009 exists and documents metrics model
- [ ] Links to CR-20251207-011

### Core Types
- [ ] PipelineEvent type defined
- [ ] EventType covers all events
- [ ] MetricsCollector implemented

### Event Emission
- [ ] `task:start` emits event
- [ ] `task:complete` emits event with optional tokens/model
- [ ] `task:rework` emits event
- [ ] `chain:new` emits event
- [ ] `request:close` emits event

### CLI Commands
- [ ] `metrics:summary` displays metrics
- [ ] `metrics:export` outputs JSON/CSV
- [ ] `metrics:import` reconstructs from git

### Historical Data
- [ ] This project has seeded metrics
- [ ] `metrics:summary` shows meaningful data

### Quality
- [ ] `pnpm build` succeeds
- [ ] `pnpm lint` passes
- [ ] Tests pass

## Test Scenario

1. Complete a task with `--tokens 1000,500 --model claude-3.5-sonnet`
2. Run `metrics:summary` - verify task appears
3. Run `metrics:export --format json` - verify event in output
4. Verify `.choragen/metrics/events.jsonl` contains event

## Post-Verification

1. Move ADR-009 to `done/`
2. Move all chain tasks to `done/`
3. Run: `choragen request:close CR-20251207-011`
4. Commit closure
