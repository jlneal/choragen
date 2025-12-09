# Task: Implement Human-in-the-Loop Checkpoints

**ID**: 005-human-checkpoints  
**Chain**: CHAIN-040-production-hardening  
**Status**: done  
**Type**: impl  
**CR**: CR-20251207-028  

---

## Objective

Implement approval prompts for sensitive actions, allowing humans to review and approve before execution.

---

## Acceptance Criteria

- [ ] Add `--require-approval` flag to `agent:start` command
- [ ] Define sensitive actions: file delete, chain close, task complete
- [ ] Display approval prompt with action details
- [ ] Wait for y/n response (default: n)
- [ ] Implement timeout (default: 5 minutes, configurable via `--approval-timeout`)
- [ ] On rejection: inform agent, continue session
- [ ] On timeout: reject action, pause session
- [ ] Add `--auto-approve` flag for CI/CD (skips prompts)
- [ ] Add unit tests for checkpoint logic

---

## Implementation Notes

### Sensitive Actions

```typescript
const SENSITIVE_ACTIONS = new Set([
  'write_file',      // When deleting (empty content)
  'task_complete',   // Completing work
  'chain_close',     // Closing a chain
  'spawn_session',   // Starting nested session
]);
```

### Approval Prompt

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  APPROVAL REQUIRED                                      │
│                                                             │
│  Action: write_file (delete)                                │
│  Path: packages/core/src/important.ts                       │
│  Session: session-20251208-143022-abc123                    │
│                                                             │
│  Approve? [y/N] (timeout: 5m)                               │
└─────────────────────────────────────────────────────────────┘
```

### Checkpoint Handler

```typescript
interface CheckpointHandler {
  requiresApproval(action: string, params: unknown): boolean;
  requestApproval(action: string, params: unknown): Promise<ApprovalResult>;
}

type ApprovalResult = 
  | { approved: true }
  | { approved: false; reason: 'rejected' | 'timeout' };
```

---

## Files to Create/Modify

- `packages/cli/src/runtime/checkpoint.ts` (create)
- `packages/cli/src/runtime/loop.ts` (modify - integrate checkpoints)
- `packages/cli/src/commands/agent/start.ts` (modify - add flags)
- `packages/cli/src/__tests__/checkpoint.test.ts` (create)
