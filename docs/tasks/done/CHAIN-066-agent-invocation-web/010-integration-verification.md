# Task: Integration Verification

**Chain**: CHAIN-066-agent-invocation-web  
**Task ID**: 010  
**Type**: impl  
**Status**: done  
**Depends On**: 001, 002, 003, 004, 005, 006, 007, 008, 009

---

## Objective

End-to-end verification that all components work together. Full workflow from chat input to agent completion.

---

## Acceptance Criteria

- [ ] Full flow works: send message → agent responds → workflow advances
- [ ] All acceptance criteria from CR-20251211-003 verified
- [ ] No console errors during normal operation
- [ ] Performance acceptable (no UI freezes)
- [ ] Works with configured API keys from CR-20251211-001

---

## Verification Checklist

From CR-20251211-003:

1. [ ] Chat input is enabled and functional
2. [ ] Sending a message adds it to workflow history
3. [ ] After human message, agent session is spawned for current stage
4. [ ] Agent responses stream to UI in real-time
5. [ ] Typing indicator shows while agent is processing
6. [ ] Agent tool calls are displayed (collapsible)
7. [ ] Agent completion updates workflow state
8. [ ] Gate approval triggers agent for next stage
9. [ ] Errors display with retry option
10. [ ] Works with configured API keys from CR-20251211-001

---

## Test Scenarios

**Scenario 1: Basic message flow**
1. Create new workflow
2. Send message via chat input
3. Verify agent responds
4. Verify message history updated

**Scenario 2: Gate advancement**
1. Navigate to workflow at gate
2. Approve gate
3. Verify agent starts for next stage
4. Verify workflow advances

**Scenario 3: Error recovery**
1. Remove API key from settings
2. Try to send message
3. Verify helpful error displayed
4. Configure API key
5. Retry, verify success

---

## Notes

This task is primarily verification. If issues found, create follow-up FRs or update previous tasks.
