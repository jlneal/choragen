# Task: Create no-circular-imports rule skeleton

**Chain**: CHAIN-079-CR-20251214-002  
**Task**: 002-rule-skeleton  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Create the basic ESLint rule structure for `no-circular-imports` following the pattern of existing rules like `no-magic-numbers-http.ts`. This task sets up the foundation that subsequent tasks will build upon.

---

## Expected Files

- `packages/eslint-plugin/src/rules/no-circular-imports.ts (new)`
- `packages/eslint-plugin/src/rules/__tests__/no-circular-imports.test.ts (new, basic structure)`

---

## File Scope

- `packages/eslint-plugin/src/rules/no-circular-imports.ts`
- `packages/eslint-plugin/src/rules/__tests__/no-circular-imports.test.ts`

---

## Acceptance Criteria

- [ ] Rule file created with proper ESLint rule structure
- [ ] Rule metadata includes: type, docs, schema, messages
- [ ] Schema defines maxDepth (number, default 5) and ignoreTypeImports (boolean, default true) options
- [ ] Placeholder create function that visits ImportDeclaration nodes
- [ ] Basic test file structure with at least one passing placeholder test
- [ ] File follows existing rule patterns (see no-magic-numbers-http.ts)
- [ ] ADR reference comment at top: ADR-002-governance-schema

---

## Notes

**Reference implementation**: `@/Users/justin/Projects/choragen/packages/eslint-plugin/src/rules/no-magic-numbers-http.ts:1-128`

**CR Reference**: CR-20251214-002 - ESLint Rule - no-circular-imports

**Error message format** (from CR):
```
Circular import detected: 
  hooks/use-metrics.ts → components/metrics/index.ts → hooks/use-time-range.ts → hooks/use-metrics.ts
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
