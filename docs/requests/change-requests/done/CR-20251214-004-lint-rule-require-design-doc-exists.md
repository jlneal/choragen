# Change Request: ESLint Rule - require-design-doc-exists

**ID**: CR-20251214-004  
**Domain**: eslint-plugin  
**Status**: done  
**Created**: 2025-12-14  
**Priority**: medium  
**Owner**: agent  
**Chain**: CHAIN-074-design-doc-exists

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

- [x] Rule extracts `designDoc` path from `DesignContract` calls
- [x] Rule resolves paths relative to project root
- [x] Rule verifies file exists on disk
- [x] Rule provides clear error with file location
- [x] Rule handles both string literals and template literals
- [x] Rule has comprehensive test coverage
- [x] Rule is enabled in `@choragen/web` eslint config

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

[Pending commit by user]

## Completion Notes

Implemented via CHAIN-074-design-doc-exists:

1. **Task 001**: Added filesystem-backed test fixtures for `designDocNotFound` scenarios
2. **Task 002**: Added template literal support via `getDesignDocPath()` function
3. **Task 003**: Enabled rule in `@choragen/web`, updated `DesignContractOptions` types, wrapped API routes

The functionality was already partially implemented in `require-design-contract` rule. This CR completed the test coverage, template literal support, and web package enablement.
