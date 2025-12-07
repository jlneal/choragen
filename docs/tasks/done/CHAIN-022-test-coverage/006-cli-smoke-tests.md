# Task: CLI smoke tests

**Chain**: CHAIN-022-test-coverage  
**Task**: 006-cli-smoke-tests  
**Status**: todo  
**Created**: 2025-12-07

---

## Objective

Create smoke tests for CLI commands to verify basic functionality.

---

## Expected Files

- `Create: packages/cli/src/__tests__/cli.test.ts`

---

## Acceptance Criteria

- [ ] Test file has @design-doc metadata tag pointing to docs/design/core/features/cli-commands.md
- [ ] Tests --help flag works
- [ ] Tests --version flag works
- [ ] Tests chain:list command (smoke test)
- [ ] Tests chain:new command (smoke test with temp dir)
- [ ] Tests task:add command (smoke test with temp dir)
- [ ] Tests error handling for invalid commands
- [ ] All tests pass: pnpm --filter @choragen/cli test

---

## Notes

Use temp directories for file system tests. Clean up after each test.
May need to add vitest to @choragen/cli if not already configured.
