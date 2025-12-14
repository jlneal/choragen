# Task: Integrate validation gate into request:close command

**Chain**: CHAIN-075-request-closure-gate  
**Task**: 002-integrate-gate  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Integrate the validation module from task 001 into `request-close.ts` so that validation runs before the file is moved to `done/`.

---

## Expected Files

- `packages/cli/src/commands/request-close.ts — Modify to call validation`

---

## File Scope

- `packages/cli/src/commands/request-close.ts`

---

## Acceptance Criteria

- [ ] closeRequest() calls validateRequestForClosure() before moving file
- [ ] If validation fails, return error with all validation messages
- [ ] If validation passes, proceed with existing close logic
- [ ] Error messages are actionable (tell user what to fix)

---

## Notes

**Integration point:**
```typescript
// In closeRequest(), after finding the file but before moving:
const validation = await validateRequestForClosure(projectRoot, requestId);
if (!validation.valid) {
  return {
    success: false,
    error: `Validation failed:\n${validation.errors.join('\n')}`,
  };
}
```

**Depends on:** Task 001 (validate-request)

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
