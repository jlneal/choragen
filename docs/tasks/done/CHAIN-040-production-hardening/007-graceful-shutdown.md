# Task: Implement Graceful Shutdown

**ID**: 007-graceful-shutdown  
**Chain**: CHAIN-040-production-hardening  
**Status**: done  
**Type**: impl  
**CR**: CR-20251207-028  

---

## Objective

Handle SIGINT/SIGTERM gracefully, saving session state before exit.

---

## Acceptance Criteria

- [ ] Register signal handlers for SIGINT (Ctrl+C) and SIGTERM
- [ ] On signal: complete current turn, save session, exit cleanly
- [ ] Set session status to `paused` (not `failed`)
- [ ] Display message: "Session paused. Resume with: choragen agent:resume <id>"
- [ ] Double Ctrl+C forces immediate exit (with warning)
- [ ] Save partial state even on forced exit
- [ ] Add unit tests for shutdown handling

---

## Implementation Notes

### Signal Handler

```typescript
let shuttingDown = false;

process.on('SIGINT', async () => {
  if (shuttingDown) {
    console.error('\nForced exit. Session state may be incomplete.');
    process.exit(1);
  }
  
  shuttingDown = true;
  console.log('\nGraceful shutdown initiated...');
  
  // Wait for current turn to complete
  await currentTurnPromise;
  
  // Save session
  session.setStatus('paused');
  await session.save();
  
  console.log(`Session paused. Resume with: choragen agent:resume ${session.id}`);
  process.exit(0);
});
```

### Shutdown Context

```typescript
interface ShutdownContext {
  isShuttingDown: boolean;
  forceExit: boolean;
  currentTurnPromise: Promise<void> | null;
}
```

---

## Files to Create/Modify

- `packages/cli/src/runtime/shutdown.ts` (create)
- `packages/cli/src/runtime/loop.ts` (modify - integrate shutdown)
- `packages/cli/src/__tests__/shutdown.test.ts` (create)
