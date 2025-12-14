# Task: Add tests for request closure gate

**Chain**: CHAIN-075-request-closure-gate  
**Task**: 004-add-tests  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Add comprehensive tests for the request closure gate functionality, covering both the validation module and the integrated close command.

---

## Expected Files

- `packages/cli/src/__tests__/request-validate.test.ts — Unit tests for validation module`
- `packages/cli/src/__tests__/request-close.test.ts — Integration tests for close with gate`

---

## File Scope

- `packages/cli/src/__tests__/request-validate.test.ts`
- `packages/cli/src/__tests__/request-close.test.ts`

---

## Acceptance Criteria

- [ ] Test: validation fails when commits section is empty
- [ ] Test: validation fails when completion notes are placeholder
- [ ] Test: validation fails when linked ADR is in todo/
- [ ] Test: validation fails when linked chain is not approved
- [ ] Test: validation fails when acceptance criteria unchecked
- [ ] Test: validation passes when all criteria met
- [ ] Test: closeRequest() blocks on validation failure
- [ ] Test: closeRequest() proceeds on validation success
- [ ] Test: closeRequest() with force=true skips validation
- [ ] All tests pass: pnpm --filter @choragen/cli test

---

## Notes

**Test fixtures needed:**
- Mock request files with various states (valid, missing commits, placeholder notes, etc.)
- Mock ADR files in different directories
- Mock chain metadata with different review statuses

**Use existing test patterns from:**
- `packages/cli/src/__tests__/metrics-import.test.ts`
- `packages/cli/src/commands/__tests__/` directory

**Depends on:** Tasks 001, 002, 003

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
