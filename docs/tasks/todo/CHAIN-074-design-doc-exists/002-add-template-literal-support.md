# Task: Add Template Literal Support for Design Doc Paths

**Chain**: CHAIN-074-design-doc-exists  
**Task**: 002-add-template-literal-support  
**Type**: impl  
**Status**: done  
**CR**: CR-20251214-004

---

## Objective

Enhance the `require-design-contract` rule to handle template literals in `designDoc` paths.

## Context

Currently, the rule only validates string literals (line 223):
```typescript
if (designDocProp.value.type === "Literal" && typeof designDocProp.value.value === "string")
```

Template literals like `` `docs/design/${feature}.md` `` are not validated.

## Acceptance Criteria

- [x] Rule handles simple template literals (no expressions)
- [x] Rule handles template literals with string literal expressions (statically resolvable)
- [x] Rule returns null for dynamic expressions (cannot statically analyze)
- [x] Tests cover template literal paths (present and missing)

## Implementation Summary

Added `getDesignDocPath()` function that handles:
1. String literals (existing behavior)
2. Template literals without expressions (backtick strings)
3. Template literals with string literal interpolations (statically resolvable)
4. Returns `null` for dynamic expressions (graceful skip)

## Implementation Notes

For template literals without expressions:
```typescript
if (designDocProp.value.type === "TemplateLiteral" && 
    designDocProp.value.expressions.length === 0) {
  const path = designDocProp.value.quasis[0].value.cooked;
  // validate path exists
}
```

For template literals with expressions, report a warning that static analysis is not possible.

## Files to Modify

- `packages/eslint-plugin/src/rules/require-design-contract.ts`
- `packages/eslint-plugin/src/__tests__/rules.test.ts`

## Verification

```bash
pnpm --filter @choragen/eslint-plugin test
pnpm --filter @choragen/eslint-plugin typecheck
```
