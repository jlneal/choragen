# Task: Integrate Lock Checking for File Writes

**ID**: 006-lock-integration  
**Chain**: CHAIN-039-file-operations  
**Status**: done  
**Type**: impl  
**CR**: CR-20251207-027  

---

## Objective

Extend the GovernanceGate to check file locks before allowing write operations, preventing conflicts between chains.

---

## Acceptance Criteria

- [ ] Check file locks before allowing `write_file` execution
- [ ] Use existing `@choragen/core` lock checking functionality
- [ ] Return clear error message with lock owner on conflict
- [ ] Add `checkLocks(path, chainId)` method to GovernanceGate
- [ ] Add unit tests for lock integration

---

## Implementation Notes

### Lock Check Flow

```
write_file called
    │
    ▼
Check role permission (existing)
    │
    ▼
Check governance rules (task 005)
    │
    ▼
Check file locks ← THIS TASK
    │ Locked by other chain → DENY "File locked by {chainId}"
    │
    ▼ Pass
Execute write
```

### Integration with @choragen/core

```typescript
import { checkLock } from "@choragen/core";

validateFileLock(path: string, currentChainId?: string): ValidationResult {
  const lockStatus = checkLock(path);
  
  if (lockStatus.locked && lockStatus.chainId !== currentChainId) {
    return {
      allowed: false,
      reason: `File ${path} is locked by chain ${lockStatus.chainId}`
    };
  }
  
  return { allowed: true };
}
```

### Error Message

```
"File packages/core/src/chains.ts is locked by chain CHAIN-038-other-feature"
```

---

## Files to Create/Modify

- `packages/cli/src/runtime/governance-gate.ts` (modify - add lock checking)
- `packages/cli/src/__tests__/governance-gate.test.ts` (modify - add tests)

---

## Dependencies

- Task 005 (governance file validation) should be done first
