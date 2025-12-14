# Task: Add comprehensive test coverage for all rule scenarios

**Chain**: CHAIN-079-CR-20251214-002  
**Task**: 006-test-coverage  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Add comprehensive test coverage for all rule scenarios including valid code, invalid code with cycles, and edge cases.

---

## Expected Files

- `packages/eslint-plugin/src/rules/__tests__/no-circular-imports.test.ts (modify)`

---

## File Scope

- `packages/eslint-plugin/src/rules/__tests__/no-circular-imports.test.ts`

---

## Acceptance Criteria

- [ ] Test direct circular imports (A → B → A)
- [ ] Test transitive circular imports (A → B → C → A)
- [ ] Test maxDepth option limits detection depth
- [ ] Test ignoreTypeImports: true skips type imports
- [ ] Test ignoreTypeImports: false includes type imports
- [ ] Test external imports are ignored
- [ ] Test error message shows full cycle path
- [ ] Test valid code (no cycles) passes
- [ ] All tests pass: pnpm --filter @choragen/eslint-plugin test

---

## Notes

**Test structure** (use RuleTester):
```typescript
const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
});

ruleTester.run('no-circular-imports', rule, {
  valid: [...],
  invalid: [...],
});
```

**Note**: Testing circular imports in ESLint is tricky because RuleTester runs on single files. May need to mock the file system or use integration tests.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
