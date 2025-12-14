# Task: Add --force flag to bypass validation

**Chain**: CHAIN-075-request-closure-gate  
**Task**: 003-add-force-flag  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Add a `--force` flag to `request:close` that bypasses validation for edge cases (e.g., closing legacy requests, emergency situations).

---

## Expected Files

- `packages/cli/src/commands/request-close.ts — Add force option`
- `packages/cli/src/cli.ts — Parse --force flag in command handler`

---

## File Scope

- `packages/cli/src/commands/request-close.ts`
- `packages/cli/src/cli.ts`

---

## Acceptance Criteria

- [ ] closeRequest() accepts optional force: boolean parameter
- [ ] When force=true, skip validation and proceed with close
- [ ] CLI parses --force flag and passes to closeRequest()
- [ ] When force is used, print warning that validation was skipped

---

## Notes

**CLI usage:**
```bash
# Normal (with validation)
choragen request:close CR-20251213-007

# Force (skip validation)
choragen request:close CR-20251213-007 --force
```

**Interface change:**
```typescript
export async function closeRequest(
  projectRoot: string,
  requestId: string,
  options?: { force?: boolean }
): Promise<CloseRequestResult>;
```

**Depends on:** Tasks 001, 002

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
