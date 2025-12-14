# Fix Request: Enhance no-core-in-client-component Rule

**ID**: FR-20251214-002  
**Domain**: eslint-plugin  
**Status**: todo  
**Created**: 2025-12-14  
**Severity**: low  
**Owner**: agent  

---

## Problem

The `no-core-in-client-component` rule is functionally general (supports configurable packages) but has naming and messaging that is specific to `@choragen/core`. This limits discoverability and usability for other server-only packages.

---

## Expected Behavior

1. Rule name should reflect its general purpose
2. Should support glob/pattern matching for import paths (e.g., `@/server/**`)
3. Error messages should be configurable per package or pattern

---

## Actual Behavior

1. Rule is named `no-core-in-client-component` (specific)
2. Only supports exact package name matching
3. Error message always suggests `@choragen/contracts` regardless of package

---

## Proposed Fix

### 1. Rename Rule

Rename from `no-core-in-client-component` to `no-server-import-in-client`.

Keep the old name as a deprecated alias for backward compatibility.

### 2. Add Pattern Support

Support glob patterns in the `packages` config:

```javascript
rules: {
  "@choragen/no-server-import-in-client": ["error", {
    packages: [
      "@choragen/core",
      "@/server/**",      // Glob pattern
      "@prisma/client"
    ]
  }]
}
```

### 3. Configurable Messages

Allow custom messages per package/pattern:

```javascript
packages: [
  { pattern: "@choragen/core", message: "Use @choragen/contracts instead" },
  { pattern: "@/server/**", message: "Server modules cannot be imported in client components" }
]
```

Or keep simple string format for defaults.

---

## Affected Files

- `packages/eslint-plugin/src/rules/no-core-in-client-component.ts` → rename to `no-server-import-in-client.ts`
- `packages/eslint-plugin/src/rules/index.ts` (update exports, add alias)
- `packages/eslint-plugin/src/rules/__tests__/no-core-in-client-component.test.ts` → rename
- `packages/web/eslint.config.mjs` (update rule name)

---

## Linked ADRs

- ADR-002-governance-schema

---

## Commits

[Added when work is committed]

---

## Verification

- [ ] Rule renamed and old name works as alias
- [ ] Glob patterns match correctly
- [ ] Custom messages display for configured packages
- [ ] All existing tests pass
- [ ] New tests added for pattern matching

---

## Completion Notes

[Added when moved to done/]
