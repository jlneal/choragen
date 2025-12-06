# Change Request: Complete Enforcement Infrastructure

**ID**: CR-20251206-002  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-06  
**Owner**: Justin  

---

## What

Expand the ESLint rules, validation scripts, and git hooks to provide comprehensive enforcement of agentic development patterns.

---

## Why

Choragen's value proposition is **deterministic control of agents through lint**. The current 5 rules are a foundation, but we need a more complete set to:
- Enforce traceability at every level
- Catch common agent mistakes
- Ensure test quality
- Maintain code hygiene

---

## Scope

### ESLint Rules to Add

**Traceability Rules**:
- `require-cr-fr-exists` - Validate CR/FR references exist
- `require-new-file-traceability` - New files need CR/FR context
- `require-bidirectional-test-links` - Tests ↔ design docs
- `require-design-doc-chain` - Features link to design docs
- `no-untracked-todos` - TODOs must reference CR/FR

**Test Quality Rules**:
- `no-trivial-assertions` - Tests must have meaningful assertions
- `require-test-assertions` - Tests must have assertions
- `require-meaningful-test-coverage` - Tests cover real scenarios

**Code Hygiene Rules**:
- `require-error-handler` - Async functions need error handling
- `require-eslint-disable-justification` - eslint-disable needs comment
- `max-eslint-disables-per-file` - Limit eslint-disable usage

### Validation Scripts to Add

- `validate:commit-traceability` - Check commits reference CR/FR
- `validate:test-coverage` - Check design ↔ test links
- `validate:agents-md` - Check AGENTS.md presence

### Git Hooks to Add

- `pre-push` - Run tests before push

**Out of Scope**:
- Project-specific rules (Supabase, React, Next.js)
- Feature flag rules
- Migration safety rules

---

## Acceptance Criteria

- [ ] All listed ESLint rules implemented and tested
- [ ] All validation scripts implemented
- [ ] pre-push hook added
- [ ] `pnpm lint` runs without errors on choragen itself
- [ ] Documentation updated

---

## Linked ADRs

- ADR-002-governance-schema

---

## Implementation Notes

Rules should be extracted/adapted from itinerary-planner where possible.
Each rule needs:
1. Implementation in `packages/eslint-plugin/src/rules/`
2. Export in index.ts
3. Addition to configs (recommended/strict)
4. Test coverage

---

## Completion Notes

[To be added when moved to done/]
