# Task: Register rule in plugin index and recommended config

**Chain**: CHAIN-079-CR-20251214-002  
**Task**: 007-register-rule  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Register the new rule in the plugin's index file and add it to the recommended configuration.

---

## Expected Files

- `packages/eslint-plugin/src/rules/index.ts (modify)`
- `packages/eslint-plugin/src/index.ts (modify if needed)`
- `packages/eslint-plugin/AGENTS.md (update documentation)`

---

## File Scope

- `packages/eslint-plugin/src/rules/index.ts`
- `packages/eslint-plugin/src/index.ts`
- `packages/eslint-plugin/AGENTS.md`

---

## Acceptance Criteria

- [ ] Rule exported from rules/index.ts
- [ ] Rule available as @choragen/no-circular-imports
- [ ] Rule added to recommended config (warn level initially)
- [ ] AGENTS.md updated with rule documentation
- [ ] Build passes: pnpm --filter @choragen/eslint-plugin build
- [ ] Typecheck passes: pnpm --filter @choragen/eslint-plugin typecheck

---

## Notes

**Registration pattern** (from existing rules):
```typescript
// rules/index.ts
export { default as noCircularImports } from './no-circular-imports';

// index.ts (in rules object)
'no-circular-imports': noCircularImports,
```

**Recommended config**: Start with `warn` level since this is a new rule and may have false positives initially.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
