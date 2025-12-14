# Change Request: ESLint Rule - no-node-imports-in-contracts

**ID**: CR-20251214-003  
**Domain**: eslint-plugin  
**Status**: done  
**Created**: 2025-12-14  
**Priority**: high  
**Owner**: agent  

---

## Summary

Create an ESLint rule to prevent Node.js-specific imports in `@choragen/contracts`, ensuring the package remains client-safe.

---

## Motivation

`@choragen/contracts` is designed to be importable from both server and client code. It contains:
- Type definitions
- `HttpStatus` enum
- `DesignContract` wrapper
- `ApiError` class

If Node.js-specific imports (`node:fs`, `node:path`, `node:crypto`, etc.) are accidentally added to this package, it will break client-side bundling with webpack errors similar to FR-20251214-001.

This rule provides a compile-time guard to maintain the package's client-safe contract.

---

## Proposed Solution

Create `@choragen/no-node-imports-in-contracts` ESLint rule that:

1. **Only applies to `packages/contracts/`** — Scoped to the contracts package
2. **Flags all `node:*` imports** — `node:fs`, `node:path`, `node:crypto`, etc.
3. **Flags common Node.js modules** — `fs`, `path`, `crypto`, `child_process`, `os`, etc.
4. **Provides clear error message** — Explains why Node imports aren't allowed

### Configuration

```javascript
// Enabled automatically for packages/contracts/**
rules: {
  "@choragen/no-node-imports-in-contracts": "error"
}
```

### Error Message

```
Node.js import 'node:fs' is not allowed in @choragen/contracts. 
This package must remain client-safe. Move Node.js-specific code to @choragen/core.
```

---

## Acceptance Criteria

- [x] Rule detects `node:*` protocol imports
- [x] Rule detects bare Node.js module imports (`fs`, `path`, etc.)
- [x] Rule only applies to files in `packages/contracts/`
- [x] Rule provides actionable error message suggesting `@choragen/core`
- [x] Rule has comprehensive test coverage
- [x] Rule is enabled in root eslint config for contracts package

---

## Linked ADRs

- ADR-002-governance-schema (ESLint plugin architecture)
- ADR-005-design-contract-api (DesignContract lives in contracts package)

---

## Linked FRs

- FR-20251214-001 (Webpack bundling error from Node.js imports)

---

## Commits

[Pending commit by user]

---

## Completion Notes

**Completed**: 2025-12-14

**Implementation**:
- `packages/eslint-plugin/src/rules/no-node-imports-in-contracts.ts` — Rule implementation
- `packages/eslint-plugin/src/rules/__tests__/no-node-imports-in-contracts.test.ts` — Test coverage
- `packages/eslint-plugin/src/rules/index.ts` — Export added

**Verification**: All tests pass, build succeeds
