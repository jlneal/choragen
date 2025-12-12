# Task: Workflow State Updates on Agent Completion

**Chain**: CHAIN-066-agent-invocation-web  
**Task ID**: 007  
**Type**: impl  
**Status**: done  
**Depends On**: 004

---

## Objective

Update workflow state when agent completes work. If the agent satisfies a gate condition, advance the workflow to the next stage.

---

## Acceptance Criteria

- [ ] Agent messages persisted to workflow history
- [ ] Gate satisfaction detected from agent output
- [ ] Workflow advances to next stage when gate satisfied
- [ ] UI reflects updated workflow state
- [ ] Workflow completion detected and status updated

---

## Implementation Notes

**Server side**: Extend agent session handling to:

1. Parse agent output for gate satisfaction signals
2. Call `workflow.satisfyGate` when detected
3. Emit state change events to client

**Client side**: 
- Listen for workflow state change events
- Refresh workflow data on state change
- Update stage indicator in UI

```typescript
// In agent session handler
if (agentOutput.gatesSatisfied) {
  await manager.satisfyGate(workflowId, stageIndex, "agent");
  emitEvent({ type: "workflow_updated", workflowId });
}
```

---

## Verification

```bash
pnpm --filter @choragen/web test
# Manual: run agent that completes a gate
# Verify workflow advances to next stage
```
