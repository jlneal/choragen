# Task: Fix remaining lint warnings

**Chain**: CHAIN-004-fix-adr-regex  
**Task**: 002-fix-lint-warnings  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

After task 001 fixes the regex, ~10 warnings will remain. Fix these to get to 0 warnings, then elevate all choragen rules to error level.

---

## Expected Files

- `Modify:`
- `packages/cli/src/cli.ts - Remove unused import`
- `packages/core/src/tasks/task-manager.ts - Fix unused vars, as unknown cast`
- `packages/core/src/governance/__tests__/governance-checker.test.ts - Add test metadata`
- `packages/core/src/governance/__tests__/governance-parser.test.ts - Add test metadata`
- `packages/core/src/tasks/__tests__/task-parser.test.ts - Add test metadata`
- `eslint.config.mjs - Elevate rules to error`

---

## Acceptance Criteria

- [ ] All unused imports/vars removed or prefixed with _
- [ ] as unknown cast replaced with proper typing or unsafeCast
- [ ] Test files have @design-doc and @user-intent metadata
- [ ] All choragen rules elevated to error in eslint.config.mjs
- [ ] pnpm lint shows 0 errors, 0 warnings

---

## Notes

**Remaining warnings after task 001** (~10):

1. `cli.ts`: Unused import `TaskManager`
2. `task-manager.ts`: Unused `parseTaskId`, unused `taskId`, `as unknown` cast
3. Test files (3): Missing `@design-doc` and `@user-intent` metadata

**Test metadata format**:
```typescript
/**
 * @design-doc docs/design/core/features/governance-enforcement.md
 * @user-intent "Verify governance rules are correctly parsed and enforced"
 */
```

**Elevate rules in eslint.config.mjs**:
Change `"warn"` to `"error"` for all `@choragen/*` rules.

**Verification**:
```bash
pnpm build
pnpm lint
```

Should see 0 errors, 0 warnings.
