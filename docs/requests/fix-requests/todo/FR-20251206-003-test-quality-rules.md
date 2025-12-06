# Fix Request: Add Test Quality Lint Rules

**ID**: FR-20251206-003  
**Domain**: core  
**Status**: todo  
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

- [ ] All 5 rules implemented
- [ ] Rules exported and added to configs
- [ ] Rules have ADR reference comments
- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes (or violations documented)

---

## Notes

These rules may need adaptation since choragen is a CLI/library, not a web app:
- `require-test-for-component` → May not apply (no React components)
- `require-test-for-api-route` → May not apply (no API routes)
- `require-test-for-lib-export` → Definitely applies

Consider which rules are relevant for a CLI/library project vs web app.

---

## Completion Notes

[To be added when moved to done/]
