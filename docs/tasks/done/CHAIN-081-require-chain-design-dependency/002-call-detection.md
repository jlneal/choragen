# Task: Implement ChainManager.create() call detection

**Chain**: CHAIN-081-require-chain-design-dependency  
**Task**: 002-call-detection  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Implement the core logic to detect `ChainManager.create()` calls and extract the options object passed to them. This is the foundation for validating chain creation patterns.

---

## Expected Files

- `packages/eslint-plugin/src/rules/require-chain-design-dependency.ts (modify)`

---

## File Scope

- `packages/eslint-plugin/src/rules/require-chain-design-dependency.ts`

---

## Acceptance Criteria

- [ ] Rule detects `ChainManager.create(...)` call expressions
- [ ] Rule detects `chainManager.create(...)` (instance method calls)
- [ ] Rule extracts the first argument (options object) from the call
- [ ] Rule handles cases where options is not an object literal (skip validation)
- [ ] Tests cover: direct call, instance call, non-object argument

---

## Notes

The rule needs to identify:
```typescript
// Static-like call
ChainManager.create({ ... })

// Instance call
const chainManager = new ChainManager(...);
chainManager.create({ ... })

// Also via await
await chainManager.create({ ... })
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
