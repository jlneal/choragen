# Task: Enhance Session Persistence for Resume

**ID**: 002-session-persistence  
**Chain**: CHAIN-040-production-hardening  
**Status**: done  
**Type**: impl  
**CR**: CR-20251207-028  

---

## Objective

Enhance the existing session persistence to support full session resume after crash or interruption.

---

## Acceptance Criteria

- [ ] Extend `SessionData` interface with `status` field: `running | paused | completed | failed`
- [ ] Add `error` field to capture failure details
- [ ] Save session state after EVERY turn (not just tool calls)
- [ ] Add `Session.listAll(workspaceRoot)` static method
- [ ] Add `Session.cleanup(workspaceRoot, olderThanDays)` static method
- [ ] Session files include all data needed to resume (messages, position)
- [ ] Add unit tests for new session methods

---

## Implementation Notes

### Extended SessionData

```typescript
interface SessionData {
  // ... existing fields ...
  status: 'running' | 'paused' | 'completed' | 'failed';
  error?: {
    message: string;
    stack?: string;
    recoverable: boolean;
  };
  // Position for resume
  lastTurnIndex: number;
}
```

### List Sessions

```typescript
static async listAll(workspaceRoot: string): Promise<SessionSummary[]> {
  // Read all .json files from .choragen/sessions/
  // Return summary: id, role, status, startTime, tokenUsage
}
```

---

## Files to Create/Modify

- `packages/cli/src/runtime/session.ts` (modify - extend interface, add methods)
- `packages/cli/src/runtime/loop.ts` (modify - save after each turn)
- `packages/cli/src/__tests__/session.test.ts` (modify - add tests)
