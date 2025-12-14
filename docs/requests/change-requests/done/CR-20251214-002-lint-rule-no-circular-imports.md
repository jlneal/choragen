# Change Request: ESLint Rule - no-circular-imports

**ID**: CR-20251214-002  
**Domain**: eslint-plugin  
**Status**: done  
**Created**: 2025-12-14  
**Completed**: 2025-12-14
**Priority**: high  
**Owner**: agent  

---

## Summary

Create an ESLint rule to detect circular import dependencies that cause webpack runtime errors.

---

## Motivation

FR-20251213-008 documented circular dependency issues in `@choragen/web` that caused cryptic webpack errors:

```
TypeError: Cannot read properties of undefined (reading 'call')
```

These errors are difficult to debug because:
1. The error message doesn't indicate which modules are involved
2. The circular chain can span multiple files
3. The issue only manifests at runtime, not compile time

Catching circular imports at lint time would prevent these runtime crashes.

---

## Proposed Solution

Create `@choragen/no-circular-imports` ESLint rule that:

1. **Detects direct circular imports** — A imports B, B imports A
2. **Detects transitive circular imports** — A → B → C → A
3. **Configurable depth** — Limit how deep to search (default: 5)
4. **Scope to packages** — Only check within package boundaries

### Configuration

```javascript
rules: {
  "@choragen/no-circular-imports": ["error", {
    maxDepth: 5,
    ignoreTypeImports: true,  // import type doesn't cause runtime issues
  }]
}
```

### Error Message

```
Circular import detected: 
  hooks/use-metrics.ts → components/metrics/index.ts → hooks/use-time-range.ts → hooks/use-metrics.ts
```

---

## Acceptance Criteria

- [x] Rule detects direct circular imports (A → B → A)
- [x] Rule detects transitive circular imports up to configurable depth
- [x] Rule ignores `import type` statements (they're stripped at compile time)
- [x] Rule respects package boundaries (doesn't cross into node_modules)
- [x] Rule provides clear error message showing the import chain
- [x] Rule has comprehensive test coverage
- [x] Rule is enabled in recommended/strict configs (available for @choragen/web)

---

## Alternatives Considered

### eslint-plugin-import `import/no-cycle`

The existing `import/no-cycle` rule from eslint-plugin-import does this but:
- Very slow on large codebases (parses entire dependency graph)
- Doesn't integrate with our existing plugin

A lighter-weight implementation scoped to our needs may be more practical.

---

## Linked ADRs

- ADR-002-governance-schema (ESLint plugin architecture)

---

## Linked FRs

- FR-20251213-008 (Circular Dependencies in Web Components)

---

## Completion Notes

Implemented `no-circular-imports` ESLint rule in `@choragen/eslint-plugin`:

**Files created/modified**:
- `packages/eslint-plugin/src/rules/no-circular-imports.ts` — Rule implementation with DFS cycle detection
- `packages/eslint-plugin/src/rules/__tests__/no-circular-imports.test.ts` — 9 comprehensive tests
- `packages/eslint-plugin/src/rules/index.ts` — Rule export
- `packages/eslint-plugin/src/index.ts` — Added to recommended (warn) and strict (error) configs
- `packages/eslint-plugin/AGENTS.md` — Documentation

**Features**:
- Direct and transitive cycle detection via DFS
- Configurable `maxDepth` (default: 5)
- `ignoreTypeImports` option (default: true)
- Package boundary respect (skips node_modules)
- Relative path display in error messages
- Performance optimizations (caching, edge count tracking)

**Task Chain**: CHAIN-079-CR-20251214-002 (6 tasks, 100% complete)

---

## Commits

- b87186b docs: complete CR-20251214-002 with task chain and completion notes
- 339e1c8 feat(eslint-plugin): add no-circular-imports rule

