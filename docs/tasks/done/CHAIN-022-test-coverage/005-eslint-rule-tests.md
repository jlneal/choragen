# Task: ESLint rule tests

**Chain**: CHAIN-022-test-coverage  
**Task**: 005-eslint-rule-tests  
**Status**: todo  
**Created**: 2025-12-07

---

## Objective

Create tests for critical ESLint rules in @choragen/eslint-plugin.

---

## Expected Files

- `Create: packages/eslint-plugin/src/__tests__/rules.test.ts`

---

## Acceptance Criteria

- [ ] Test file has @design-doc metadata tag pointing to docs/design/core/features/eslint-plugin.md
- [ ] Tests require-design-contract rule (valid and invalid cases)
- [ ] Tests no-magic-numbers-http rule (valid and invalid cases)
- [ ] Tests require-adr-reference rule (valid and invalid cases)
- [ ] Uses ESLint RuleTester pattern
- [ ] All tests pass: pnpm --filter @choragen/eslint-plugin test

---

## Notes

May need to add vitest to @choragen/eslint-plugin if not already configured.
Use ESLint's RuleTester for testing rules.
