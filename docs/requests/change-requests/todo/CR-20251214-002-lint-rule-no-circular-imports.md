# Change Request: ESLint Rule - no-circular-imports

**ID**: CR-20251214-002  
**Domain**: eslint-plugin  
**Status**: todo  
**Created**: 2025-12-14  
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

- [ ] Rule detects direct circular imports (A → B → A)
- [ ] Rule detects transitive circular imports up to configurable depth
- [ ] Rule ignores `import type` statements (they're stripped at compile time)
- [ ] Rule respects package boundaries (doesn't cross into node_modules)
- [ ] Rule provides clear error message showing the import chain
- [ ] Rule has comprehensive test coverage
- [ ] Rule is enabled in `@choragen/web` eslint config

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

## Commits

[Added when work is committed]
