# Task: Implement chain type validation logic

**Chain**: CHAIN-081-require-chain-design-dependency  
**Task**: 003-type-validation  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Implement the validation logic that checks if a chain has `type: "implementation"` and, if so, requires either `dependsOn` or (`skipDesign` + `skipDesignJustification`).

---

## Expected Files

- `packages/eslint-plugin/src/rules/require-chain-design-dependency.ts (modify)`

---

## File Scope

- `packages/eslint-plugin/src/rules/require-chain-design-dependency.ts`

---

## Acceptance Criteria

- [ ] Rule extracts `type` property from options object
- [ ] Rule only validates when `type` is `"implementation"` (string literal)
- [ ] Rule checks for `dependsOn` property presence
- [ ] Rule checks for `skipDesign: true` AND `skipDesignJustification` (non-empty string)
- [ ] Rule reports error with helpful message when neither condition is met
- [ ] Rule ignores design chains (`type: "design"`)
- [ ] Rule ignores chains without explicit type

---

## Notes

Valid patterns:
```typescript
// OK: Has dependsOn
{ type: "implementation", dependsOn: "CHAIN-001-design" }

// OK: Has skip justification
{ type: "implementation", skipDesign: true, skipDesignJustification: "Hotfix" }

// OK: Design chain (no validation needed)
{ type: "design" }

// OK: No type specified (no validation needed)
{ requestId: "CR-001" }
```

Invalid patterns:
```typescript
// ERROR: Implementation without dependency or skip
{ type: "implementation", requestId: "CR-001" }

// ERROR: skipDesign without justification
{ type: "implementation", skipDesign: true }

// ERROR: skipDesignJustification without skipDesign
{ type: "implementation", skipDesignJustification: "reason" }
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
