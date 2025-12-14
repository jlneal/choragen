# Change Request: ESLint Rule - require-design-doc-exists

**ID**: CR-20251214-004  
**Domain**: eslint-plugin  
**Status**: todo  
**Created**: 2025-12-14  
**Priority**: medium  
**Owner**: agent  

---

## Summary

Enhance the `require-design-contract` rule to verify that the referenced design document path actually exists on disk.

---

## Motivation

ADR-005 establishes that API handlers must be wrapped in `DesignContract` with a `designDoc` path. Currently, the rule only checks that the wrapper is present, not that the path is valid.

Invalid paths break traceability:
- Dead links in code
- False sense of documentation coverage
- Broken audit trails

---

## Proposed Solution

Enhance or create a rule that validates design doc paths:

1. **Extract `designDoc` value** from `DesignContract` calls
2. **Resolve path** relative to project root
3. **Check file exists** on disk
4. **Report error** if file doesn't exist

### Configuration

```javascript
rules: {
  "@choragen/require-design-doc-exists": ["error", {
    projectRoot: process.cwd(),  // Or configured path
  }]
}
```

### Error Message

```
Design document 'docs/design/core/features/nonexistent.md' does not exist.
Referenced in DesignContract at src/app/api/tasks/route.ts:5
```

---

## Acceptance Criteria

- [ ] Rule extracts `designDoc` path from `DesignContract` calls
- [ ] Rule resolves paths relative to project root
- [ ] Rule verifies file exists on disk
- [ ] Rule provides clear error with file location
- [ ] Rule handles both string literals and template literals
- [ ] Rule has comprehensive test coverage
- [ ] Rule is enabled in `@choragen/web` eslint config

---

## Implementation Notes

This rule requires filesystem access, which is unusual for ESLint rules. Options:
1. **Sync fs check** — Simple but may slow linting
2. **Cache file existence** — Check once per lint run
3. **Separate validator script** — Keep ESLint fast, run as separate CI step

Recommend option 2 (cached check) for balance of correctness and performance.

---

## Linked ADRs

- ADR-002-governance-schema (ESLint plugin architecture)
- ADR-005-design-contract-api (DesignContract requirements)

---

## Commits

[Added when work is committed]
