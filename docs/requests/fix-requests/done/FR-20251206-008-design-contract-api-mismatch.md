# Fix Request: DesignContract API Mismatch

**ID**: FR-20251206-008  
**Domain**: contracts  
**Status**: done  
**Created**: 2025-12-06  
**Severity**: medium  
**Owner**: agent  

---

## Problem

The `DesignContract` API documented in AGENTS.md and package documentation does not match the actual implementation. Documentation shows a function-wrapper pattern, but implementation is a class with method chaining.

---

## Expected Behavior

Documentation shows this pattern:
```typescript
export const GET = DesignContract({
  designDoc: "docs/design/core/features/task-management.md",
  handler: async (request: Request) => {
    // Implementation
    return Response.json({ data: result }, { status: HttpStatus.OK });
  },
});
```

This suggests `DesignContract` is a function that wraps a handler and returns an enhanced handler.

---

## Actual Behavior

The actual implementation in `packages/contracts/src/design-contract.ts` is:
```typescript
export class DesignContract<TInput, TOutput> {
  constructor(options: ContractOptions) { ... }
  pre(check: (input: TInput) => string | null): this { ... }
  post(check: (output: TOutput) => string | null): this { ... }
  validateInput(input: TInput): ContractResult<TInput> { ... }
  validateOutput(output: TOutput): ContractResult<TOutput> { ... }
}
```

This is a class for building contracts with pre/postconditions, not a handler wrapper.

---

## Steps to Reproduce

1. Read AGENTS.md "Common Patterns" section
2. Try to use the documented pattern
3. Observe that it doesn't work with the actual API

---

## Root Cause Analysis

The documentation was written for the intended API (ported from itinerary-planner), but the implementation was either:
1. Simplified during extraction, or
2. Never fully ported

The class-based API is useful for contract validation but doesn't serve the primary use case: wrapping API route handlers with design doc traceability.

---

## Proposed Fix

Option A: **Add function wrapper** (recommended)
- Add a `DesignContract()` function export that wraps handlers
- Keep the class as `DesignContractBuilder` for advanced use cases
- Update ESLint rule `require-design-contract` to check for the function wrapper

Option B: **Update documentation**
- Change all documentation to match the class-based API
- Less useful for the primary use case

---

## Affected Files

- `packages/contracts/src/design-contract.ts`
- `packages/contracts/src/index.ts`
- `AGENTS.md`
- `packages/contracts/AGENTS.md`
- `packages/eslint-plugin/src/rules/require-design-contract.ts`

---

## Linked ADRs

- ADR-002-governance-schema (referenced in design-contract.ts)

---

## Commits

No commits yet.

---

## Verification

- [x] Bug no longer reproducible
- [x] Documented pattern works as shown
- [ ] ESLint rule validates the correct pattern (existing rule, not updated)
- [ ] Regression test added (deferred to CR-20251206-008)

---

## Completion Notes

**Completed**: 2025-12-06

**Changes made:**
1. Added `DesignContract` function wrapper that matches documented API
2. Renamed class to `DesignContractBuilder` for advanced use cases
3. Added `isDesignContract()` and `getDesignContractMetadata()` helper functions
4. Added `DesignContractOptions` type for the function wrapper
5. Updated `packages/contracts/AGENTS.md` with new API documentation
6. Exported all new types and functions from index.ts

**Task Chain**: CHAIN-018-fix-design-contract (3 tasks completed)
