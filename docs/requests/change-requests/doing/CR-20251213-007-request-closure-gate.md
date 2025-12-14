# Change Request: Request Closure Gate

**ID**: CR-20251213-007  
**Domain**: core  
**Status**: doing  
**Created**: 2025-12-13  
**Owner**: agent  

---

## What

Introduce a **request closure gate** that fires before moving a CR/FR from `doing/` to `done/`. This ensures all request-level requirements are satisfied before closure.

This CR introduces:
1. A `request_close` gate type or validation hook
2. Request-level completeness verification
3. Integration with `choragen request:close` command

---

## Why

Requests can currently be closed without verification that:
- The commits section is populated with actual commit references
- Completion notes summarize what was implemented
- Linked ADRs are in the correct state (`done/` not `todo/`)
- All associated chains are complete
- The request file itself is properly formatted

A request closure gate provides a final checkpoint before the request is marked complete.

---

## Acceptance Criteria

- [x] `choragen request:close` runs validation before moving file
- [x] Gate verifies commits section is not empty
- [x] Gate verifies completion notes are present and non-placeholder
- [x] Gate verifies linked ADRs are in `done/` or `doing/`
- [x] Gate verifies all linked chains are complete
- [x] Failed validations block closure with actionable messages
- [x] Gate can be bypassed with explicit flag (for edge cases)

---

## Scope

**In scope:**
- Request file validation
- Commit reference verification
- Completion notes verification
- ADR state verification
- Chain completion verification

**Out of scope:**
- Automated quality assessment of completion notes
- Cross-request validation
- Historical request migration

---

## Affected Design Documents

- [Standard Workflow](../../../design/core/features/standard-workflow.md) — Add request closure gate concept
- [Development Pipeline](../../../design/DEVELOPMENT_PIPELINE.md) — Request lifecycle validation

---

## Linked ADRs

None required — enhancement to existing CLI command structure (ADR-003-cli-structure)

---

## Commits

No commits yet.

---

## Task Chain

**Chain**: CHAIN-075-request-closure-gate

Tasks:
1. `001-validate-request` — Create request validation module with completeness checks
2. `002-integrate-gate` — Integrate validation gate into request:close command
3. `003-add-force-flag` — Add --force flag to bypass validation
4. `004-add-tests` — Add tests for request closure gate

---

## Implementation Notes

### Validation Checks

The request closure gate should verify:

1. **Commits section** — Not empty, not placeholder text
2. **Completion notes** — Present and not placeholder
3. **ADR state** — Linked ADRs moved from `todo/` to `done/`
4. **Chain state** — All linked chains have `reviewStatus: approved`
5. **File format** — Status field updated to `done`

### CLI Integration

```bash
# Current behavior
choragen request:close CR-20251213-003

# With gate
choragen request:close CR-20251213-003
# → Runs validations
# → If pass: moves file to done/
# → If fail: prints errors, does not move

# Bypass for emergencies
choragen request:close CR-20251213-003 --force
```

### Validation Script

This could leverage the existing `validate-request-completion.mjs` script, making it a blocking gate rather than just a pre-commit check.

---

## Completion Notes

Implemented request closure gate with the following components:

1. **Validation module** (`packages/cli/src/commands/request-validate.ts`)
   - `validateRequestForClosure()` function checks commits, completion notes, ADR links, chain approval status, and acceptance criteria
   - Ported section/placeholder detection from `scripts/validate-request-completion.mjs`

2. **Integration** (`packages/cli/src/commands/request-close.ts`)
   - Validation runs before file move; failures return actionable error list
   - Existing close logic preserved for successful validations

3. **Force bypass** (`--force` flag)
   - Skips validation gate for edge cases
   - Prints warning when used

4. **Tests** (`packages/cli/src/__tests__/request-validate.test.ts`, `request-close.test.ts`)
   - Unit tests for all validation checks
   - Integration tests for blocking, success, and force mode
