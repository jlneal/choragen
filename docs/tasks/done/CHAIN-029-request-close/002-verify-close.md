# Task: Verify and Close FR

**Chain**: CHAIN-029-request-close  
**Task**: 002-verify-close  
**Type**: control  
**Status**: todo  

---

## Objective

Verify request:close command works and close FR-20251207-004.

---

## Verification

1. Build CLI: `pnpm --filter @choragen/cli build`
2. Test command: `choragen request:close FR-20251207-004`
3. Verify:
   - FR moved to done/
   - ## Commits section populated
   - Status updated to done

---

## Post-Verification

1. Move task files to done
2. Commit with proper reference

---

## Commit Format

```
feat(cli): add request:close command

- Populate ## Commits section from git log
- Update status to done
- Move request file to done/

FR-20251207-004
```

---

## Note

This is a special case: we'll use the new command to close its own FR!
