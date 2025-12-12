# Task: Gate Approval Triggers Agent

**Chain**: CHAIN-066-agent-invocation-web  
**Task ID**: 008  
**Type**: impl  
**Status**: done  
**Depends On**: 007

---

## Objective

When a user approves a gate (human approval type), automatically trigger the agent for the next stage.

---

## Acceptance Criteria

- [ ] Gate approval button triggers agent invocation
- [ ] Agent starts for the newly active stage
- [ ] Smooth transition in UI (approval → typing indicator → agent work)
- [ ] Works for all gate types that advance stages

---

## Implementation Notes

**File**: `packages/web/src/components/chat/gate-approval.tsx` (or similar)

Current flow:
1. User clicks "Approve" on gate
2. `satisfyGate` mutation called
3. Workflow advances

New flow:
1. User clicks "Approve" on gate
2. `satisfyGate` mutation called
3. Workflow advances
4. **Automatically call `invokeAgent` for new stage**
5. Agent begins work, streams to UI

```typescript
const handleApprove = async () => {
  await satisfyGate.mutateAsync({ workflowId, stageIndex, satisfiedBy: "user" });
  // Trigger agent for next stage
  await invokeAgent.mutateAsync({ workflowId });
};
```

---

## Verification

```bash
pnpm --filter @choragen/web dev
# Navigate to workflow at gate
# Approve gate
# Verify agent automatically starts for next stage
```
