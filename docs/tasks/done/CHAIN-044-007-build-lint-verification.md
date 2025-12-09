# Task: Build & Lint Verification

**Chain**: CHAIN-044-chain-task-viewer  
**Task ID**: 007-build-lint-verification  
**Type**: impl  
**Status**: done  
**Completed**: 2025-12-09  
**Created**: 2025-12-09

---

## Objective

Verify all chain/task viewer code passes build and lint checks.

---

## Description

Final verification task:

1. Run `pnpm build` - ensure no TypeScript errors
2. Run `pnpm lint` - ensure no ESLint violations
3. Run `pnpm --filter @choragen/web typecheck` - type verification
4. Manual smoke test of chain list and detail pages
5. Fix any issues discovered

---

## Expected Files

No new files - fixes to existing files as needed.

---

## Acceptance Criteria

- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm --filter @choragen/web typecheck` passes
- [ ] Chain list page renders correctly
- [ ] Chain detail page renders correctly
- [ ] Task detail panel opens and displays data
- [ ] All filters and sorting work

---

## Constraints

- All fixes must maintain existing functionality
- No skipping or disabling lint rules
- ADR reference: ADR-011-web-api-architecture

---

## Notes

This is the final task before CR completion. All 14 acceptance criteria from CR-20251208-004 should be verified.
