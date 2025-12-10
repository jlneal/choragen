# Task: Build Verification

**Chain**: CHAIN-049  
**Task**: T004  
**Type**: control  
**Status**: done  
**Request**: CR-20251209-024  

---

## Objective

Verify the backlog feature implementation passes all quality checks.

---

## Acceptance Criteria

1. `pnpm --filter @choragen/web typecheck` passes
2. `pnpm --filter @choragen/web lint` passes
3. `pnpm --filter @choragen/web test` passes (all tests including new backlog tests)
4. `pnpm --filter @choragen/web build` succeeds
5. Manual smoke test: promote and demote a request via UI

---

## Verification Commands

```bash
# Type check
pnpm --filter @choragen/web typecheck

# Lint
pnpm --filter @choragen/web lint

# Tests
pnpm --filter @choragen/web test

# Build
pnpm --filter @choragen/web build
```

---

## Manual Smoke Test

1. Start dev server: `pnpm --filter @choragen/web dev`
2. Navigate to `/requests`
3. Create or find a request in backlog
4. Click "Promote to Todo" — verify it moves
5. Click "Move to Backlog" on a todo request — verify it moves
6. Check file system to confirm files moved correctly

---

## Notes

This is a control task. Upon completion, report back to control agent for CR closure.
