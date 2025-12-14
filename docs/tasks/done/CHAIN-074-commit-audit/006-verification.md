# Task: Verification

**Chain**: CHAIN-074-commit-audit  
**Task**: 006  
**Status**: todo  
**Type**: control  
**Created**: 2025-12-13

---

## Objective

Verify that all implementation tasks are complete and the commit audit mechanism is ready for use.

---

## Context

This is the final task in the chain. It verifies:
1. All types are properly exported
2. Build passes
3. Tests pass
4. Lint passes
5. Design docs are updated
6. ADR is complete

---

## Expected Files

- N/A — verification task

---

## Acceptance Criteria

- [ ] `pnpm build` passes
- [ ] `pnpm test` passes
- [ ] `pnpm lint` passes
- [ ] `packages/core/src/audit/` exports are accessible
- [ ] `packages/core/src/feedback/types.ts` includes `audit` type
- [ ] `templates/workflow-templates/audit.yaml` exists and is valid
- [ ] Design docs updated per Task 005
- [ ] ADR-015 linked in CR

---

## Constraints

- Do not modify code — verification only
- Report any failures for rework

---

## Notes

Run verification commands:
```bash
pnpm build
pnpm test
pnpm lint
```
