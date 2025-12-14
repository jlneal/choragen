# Change Request: ESLint Rule - require-chain-design-dependency

**ID**: CR-20251214-006  
**Domain**: eslint-plugin  
**Status**: todo  
**Created**: 2025-12-14  
**Priority**: low  
**Owner**: agent  

---

## Summary

Create an ESLint rule to enforce that implementation chains have either a design chain dependency or explicit skip justification.

---

## Motivation

ADR-006 establishes the chain type system:
- **Design chains** — Focus on WHAT to build
- **Implementation chains** — Focus on HOW to build, must reference design chain OR justify skipping

FR-20251206-009 documented violations where implementation chains lacked design dependencies. While this was a bootstrap issue, ongoing enforcement prevents architectural drift.

---

## Proposed Solution

Create `@choragen/require-chain-design-dependency` ESLint rule that:

1. **Applies to chain creation code** — `ChainManager.create()` calls
2. **Checks chain type** — If `type: "implementation"`
3. **Requires dependency or skip** — Must have `dependsOn` OR (`skipDesign` AND `skipDesignJustification`)

### Configuration

```javascript
rules: {
  "@choragen/require-chain-design-dependency": "error"
}
```

### Error Message

```
Implementation chain must have either:
  - 'dependsOn' referencing a design chain, OR
  - 'skipDesign: true' with 'skipDesignJustification' explaining why

Example with dependency:
  ChainManager.create({ type: "implementation", dependsOn: "CHAIN-001-design" })

Example with skip:
  ChainManager.create({ 
    type: "implementation", 
    skipDesign: true, 
    skipDesignJustification: "Hotfix for production issue" 
  })
```

---

## Acceptance Criteria

- [ ] Rule detects `ChainManager.create()` calls with `type: "implementation"`
- [ ] Rule requires `dependsOn` OR (`skipDesign` + `skipDesignJustification`)
- [ ] Rule ignores design chains and chains without explicit type
- [ ] Rule provides clear error with examples
- [ ] Rule has comprehensive test coverage
- [ ] Rule is enabled in `@choragen/core` and `@choragen/cli` eslint configs

---

## Implementation Notes

This rule analyzes object literals passed to `ChainManager.create()`:

```typescript
// ❌ Error: Missing design dependency or skip justification
ChainManager.create({
  id: "CHAIN-001",
  type: "implementation",
  requestId: "CR-001",
});

// ✅ OK: Has design dependency
ChainManager.create({
  id: "CHAIN-001",
  type: "implementation",
  requestId: "CR-001",
  dependsOn: "CHAIN-000-design",
});

// ✅ OK: Has skip justification
ChainManager.create({
  id: "CHAIN-001",
  type: "implementation",
  requestId: "CR-001",
  skipDesign: true,
  skipDesignJustification: "Bootstrap: Framework initialization",
});
```

---

## Linked ADRs

- ADR-002-governance-schema (ESLint plugin architecture)
- ADR-006-chain-type-system (Chain type requirements)

---

## Linked FRs

- FR-20251206-009 (Chain Type Validation Violations)

---

## Commits

[Added when work is committed]
