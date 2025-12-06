# Fix Request: Add Code Hygiene Lint Rules

**ID**: FR-20251206-005  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-06  
**Owner**: Justin  

---

## Problem

We're missing code hygiene rules that catch common error handling and code quality issues.

---

## Missing Rules (5)

| Rule | Purpose |
|------|---------|
| `require-error-handler` | Async functions must have error handling |
| `require-try-catch-in-async` | Try/catch required in async functions |
| `require-error-boundary` | React components need error boundaries |
| `max-eslint-disables-ratio` | Limit eslint-disable as % of file |
| `require-readonly-properties` | Prefer readonly for immutable properties |

---

## Acceptance Criteria

- [x] All 5 rules implemented (skip React-specific if not applicable)
- [x] Rules exported and added to configs
- [x] Rules have ADR reference comments
- [x] `pnpm build` passes
- [x] `pnpm lint` passes

---

## Notes

- `require-error-boundary` may not apply (no React in choragen core)
- Consider if `require-try-catch-in-async` overlaps with `require-error-handler`
- `max-eslint-disables-ratio` complements existing `max-eslint-disables-per-file`

---

## Completion Notes

**Completed**: 2025-12-06

All 5 code hygiene rules implemented in `@choragen/eslint-plugin`:

| Rule | File | Lines |
|------|------|-------|
| `require-error-handler` | `require-error-handler.ts` | 5.8k |
| `require-try-catch-in-async` | `require-try-catch-in-async.ts` | 7.1k |
| `require-error-boundary` | `require-error-boundary.ts` | 3.7k |
| `max-eslint-disables-ratio` | `max-eslint-disables-ratio.ts` | 3.6k |
| `require-readonly-properties` | `require-readonly-properties.ts` | 4.4k |

**Verification**:
- `pnpm build` - ✅ passes (5 packages built)
- `pnpm lint` - ✅ passes (0 errors)
- All rules exported in `rules/index.ts`
- All rules configured in `recommended` and `strict` configs
