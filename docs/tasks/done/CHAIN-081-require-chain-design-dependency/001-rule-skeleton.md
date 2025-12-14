# Task: Create require-chain-design-dependency rule skeleton

**Chain**: CHAIN-081-require-chain-design-dependency  
**Task**: 001-rule-skeleton  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Create the basic ESLint rule structure for `require-chain-design-dependency` following the pattern of existing rules. This rule enforces that implementation chains have either a design chain dependency or explicit skip justification.

---

## Expected Files

- `packages/eslint-plugin/src/rules/require-chain-design-dependency.ts (new)`
- `packages/eslint-plugin/src/rules/__tests__/require-chain-design-dependency.test.ts (new, basic structure)`

---

## File Scope

- `packages/eslint-plugin/src/rules/require-chain-design-dependency.ts`
- `packages/eslint-plugin/src/rules/__tests__/require-chain-design-dependency.test.ts`

---

## Acceptance Criteria

- [ ] Rule file created with proper ESLint rule structure
- [ ] Rule metadata includes: type, docs, schema, messages
- [ ] Placeholder create function that visits CallExpression nodes
- [ ] Basic test file structure with at least one passing placeholder test
- [ ] File follows existing rule patterns (see no-circular-imports.ts)
- [ ] ADR reference comment at top: ADR-002-governance-schema, ADR-006-chain-type-system

---

## Notes

**Reference implementation**: `packages/eslint-plugin/src/rules/no-circular-imports.ts`

**CR Reference**: CR-20251214-006 - ESLint Rule - require-chain-design-dependency

**Error message format** (from CR):
```
Implementation chain must have either:
  - 'dependsOn' referencing a design chain, OR
  - 'skipDesign: true' with 'skipDesignJustification' explaining why

Example with dependency:
  ChainManager.create({ type: "implementation", dependsOn: "CHAIN-001-design" })

Example with skip:
  ChainManager.create({ 
    type: "implementation", 
    skipDesign: true, 
    skipDesignJustification: "Hotfix for production issue" 
  })
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
