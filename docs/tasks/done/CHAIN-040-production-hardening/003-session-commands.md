# Task: Implement Session Management Commands

**ID**: 003-session-commands  
**Chain**: CHAIN-040-production-hardening  
**Status**: done  
**Type**: impl  
**CR**: CR-20251207-028  

---

## Objective

Implement CLI commands for managing agent sessions: resume, list, and cleanup.

---

## Acceptance Criteria

- [ ] Implement `choragen agent:resume <session-id>` command
- [ ] Implement `choragen agent:list-sessions` command
- [ ] Implement `choragen agent:cleanup [--older-than <days>]` command
- [ ] Resume command restores session state and continues from last turn
- [ ] List command shows: id, role, status, started, tokens used
- [ ] Cleanup command removes old completed/failed sessions
- [ ] Add unit tests for all commands

---

## Implementation Notes

### Resume Command

```typescript
// packages/cli/src/commands/agent/resume.ts
export const resumeCommand = new Command('resume')
  .argument('<session-id>', 'Session ID to resume')
  .action(async (sessionId) => {
    const session = await Session.load(sessionId, process.cwd());
    if (!session) throw new Error(`Session not found: ${sessionId}`);
    if (session.status === 'completed') throw new Error('Session already completed');
    
    // Restore messages and continue loop
    await runAgentLoop({ session, resume: true });
  });
```

### List Sessions Output

```
ID                              Role     Status     Started              Tokens
session-20251208-143022-abc123  impl     running    2025-12-08 14:30:22  12,450
session-20251208-140015-def456  control  completed  2025-12-08 14:00:15  8,230
```

---

## Files to Create/Modify

- `packages/cli/src/commands/agent/resume.ts` (create)
- `packages/cli/src/commands/agent/list-sessions.ts` (create)
- `packages/cli/src/commands/agent/cleanup.ts` (create)
- `packages/cli/src/commands/agent/index.ts` (modify - register commands)
- `packages/cli/src/__tests__/agent-commands.test.ts` (modify - add tests)
