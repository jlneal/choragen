# Task: Add ignoreTypeImports option to skip type-only imports

**Chain**: CHAIN-079-CR-20251214-002  
**Task**: 005-type-import-filter  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Add support for the `ignoreTypeImports` option that skips `import type` statements since they are stripped at compile time and don't cause runtime circular dependency issues.

---

## Expected Files

- `packages/eslint-plugin/src/rules/no-circular-imports.ts (modify)`

---

## File Scope

- `packages/eslint-plugin/src/rules/no-circular-imports.ts`

---

## Acceptance Criteria

- [ ] Detect import type { Foo } from './bar' statements
- [ ] Detect import { type Foo } from './bar' inline type imports
- [ ] When ignoreTypeImports: true (default), skip type-only imports
- [ ] When ignoreTypeImports: false, include type imports in cycle detection
- [ ] Add tests for type import filtering

---

## Notes

**AST patterns to detect**:
- `ImportDeclaration` with `importKind: 'type'` → full type import
- `ImportSpecifier` with `importKind: 'type'` → inline type import

**Rationale**: TypeScript strips `import type` at compile time, so they never cause webpack runtime errors.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
