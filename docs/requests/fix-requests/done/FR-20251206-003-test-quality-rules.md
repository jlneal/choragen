# Fix Request: Add Test Quality Lint Rules

**ID**: FR-20251206-003  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-06  
**Owner**: Justin  

---

## Problem

We're missing lint rules that ensure tests actually exercise the code they claim to test. Current rules only check for test presence and metadata, not test quality.

---

## Missing Rules (5)

| Rule | Purpose |
|------|---------|
| `require-test-exercises-component` | Component tests must actually render the component |
| `require-test-exercises-route` | Route tests must actually call the route |
| `require-test-for-api-route` | API routes must have corresponding test files |
| `require-test-for-component` | Components must have corresponding test files |
| `require-test-for-lib-export` | Lib exports must have corresponding test files |

---

## Acceptance Criteria

- [x] All 5 rules implemented
- [x] Rules exported and added to configs
- [x] Rules have ADR reference comments
- [x] `pnpm build` passes
- [x] `pnpm lint` passes (or violations documented)

---

## Notes

These rules may need adaptation since choragen is a CLI/library, not a web app:
- `require-test-for-component` → May not apply (no React components)
- `require-test-for-api-route` → May not apply (no API routes)
- `require-test-for-lib-export` → Definitely applies

Consider which rules are relevant for a CLI/library project vs web app.

---

## Completion Notes

**Completed**: 2025-12-06  
**Chain**: CHAIN-007-test-quality-rules (6 tasks)

### Rules Added (5)

1. **require-test-exercises-component** - Component tests must render and interact
2. **require-test-exercises-route** - Route tests must call HTTP methods
3. **require-test-for-api-route** - API routes need test files
4. **require-test-for-component** - Components need test files
5. **require-test-for-lib-export** - Lib exports need test files

### Verification

```
✅ pnpm build - passes
✅ pnpm lint - passes  
✅ pnpm test - passes (32 tests)
```

### Rule Count

- Before: 21 rules
- After: 26 rules (+5)
