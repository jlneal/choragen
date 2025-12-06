# Fix Request: Add Code Hygiene Lint Rules

**ID**: FR-20251206-005  
**Domain**: core  
**Status**: todo  
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

- [ ] All 5 rules implemented (skip React-specific if not applicable)
- [ ] Rules exported and added to configs
- [ ] Rules have ADR reference comments
- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes

---

## Notes

- `require-error-boundary` may not apply (no React in choragen core)
- Consider if `require-try-catch-in-async` overlaps with `require-error-handler`
- `max-eslint-disables-ratio` complements existing `max-eslint-disables-per-file`

---

## Completion Notes

[To be added when moved to done/]
