# Task: Create request validation module with completeness checks

**Chain**: CHAIN-075-request-closure-gate  
**Task**: 001-validate-request  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Create a reusable request validation module that performs completeness checks before a request can be closed. This module will be called by `request:close` to gate closure.

**Key validations:**
1. Commits section is not empty/placeholder
2. Completion notes are present and non-placeholder
3. Linked ADRs are in `done/` or `doing/` (not `todo/`)
4. All linked chains have `reviewStatus: approved`
5. All acceptance criteria are checked off

---

## Expected Files

- `packages/cli/src/commands/request-validate.ts — New validation module`

---

## File Scope

- `packages/cli/src/commands/request-validate.ts`

---

## Acceptance Criteria

- [ ] validateRequestForClosure(projectRoot, requestId) function exported
- [ ] Returns { valid: boolean, errors: string[] }
- [ ] Validates commits section is not empty/placeholder
- [ ] Validates completion notes are present and non-placeholder
- [ ] Validates linked ADRs are not in todo/
- [ ] Validates linked chains have reviewStatus: approved
- [ ] Validates all acceptance criteria are checked
- [ ] Reuses logic from validate-request-completion.mjs where applicable

---

## Notes

**Reference files:**
- `scripts/validate-request-completion.mjs` — Has `extractSection()`, `isCompletionNotesFilled()`, `countUncheckedCriteria()`
- `packages/cli/src/commands/request-close.ts` — Current close logic, `getCommitsForRequest()`

**Interface suggestion:**
```typescript
export interface RequestValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export async function validateRequestForClosure(
  projectRoot: string,
  requestId: string
): Promise<RequestValidationResult>;
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
