# Fix Request: Add Complete Traceability Lint Rules

**ID**: FR-20251206-002  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-06  
**Owner**: Justin  

---

## Problem

Choragen only has 12 ESLint rules, but itinerary-planner has 57. We're missing the core traceability rules that enforce bidirectional linking between design docs, tests, ADRs, and implementation.

Without these rules, we can't enforce the traceability chain we require of other projects.

---

## Missing Rules (9)

| Rule | Purpose |
|------|---------|
| `require-bidirectional-test-links` | Tests ↔ design docs must reference each other |
| `require-cr-fr-exists` | CR/FR references in code must be valid files |
| `require-design-doc-chain` | Design docs must link to ADRs |
| `require-design-doc-completeness` | Design docs have required sections |
| `require-adr-implementation` | ADRs in done/ must have source file refs |
| `require-adr-relevance` | ADR refs in code must match file purpose |
| `require-meaningful-test-coverage` | Tests must cover design intents |
| `require-semantic-user-intent` | @user-intent must be meaningful, not boilerplate |
| `require-significant-change-traceability` | Large changes need CR/FR |

---

## Acceptance Criteria

- [ ] All 9 rules implemented
- [ ] Rules exported and added to configs
- [ ] Rules have ADR reference comments
- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes (or violations documented)

---

## Notes

Port from itinerary-planner:
- `/Users/justin/Projects/itinerary-planner/eslint/rules/require-bidirectional-test-links.mjs`
- `/Users/justin/Projects/itinerary-planner/eslint/rules/require-cr-fr-exists.mjs`
- etc.

These rules may need adaptation for choragen's structure.

---

## Completion Notes

[To be added when moved to done/]
