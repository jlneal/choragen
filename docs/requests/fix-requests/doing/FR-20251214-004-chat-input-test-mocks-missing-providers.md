# Fix Request: Chat Input Test Mocks Missing Providers Router

**ID**: FR-20251214-004  
**Domain**: web  
**Status**: doing  
**Created**: 2025-12-14  
**Severity**: medium  
**Owner**: agent  

---

## Problem

Four tests in `@choragen/web` fail because the tRPC mock for `@/lib/trpc/client` doesn't include `providers.listModels` and `workflow.currentModel` which `ChatInput` now uses after the model selection feature was added.

---

## Expected Behavior

All tests in `responsive.test.tsx` and `provider-status.test.tsx` should pass.

---

## Actual Behavior

Tests fail with:
```
TypeError: Cannot read properties of undefined (reading 'listModels')
```

Failing tests:
- `responsive.test.tsx`: 3 tests fail
- `provider-status.test.tsx`: 1 test fails

---

## Steps to Reproduce

1. Run `pnpm --filter @choragen/web test`
2. Observe 4 failing tests in chat component tests

---

## Root Cause Analysis

The model selection feature (commit `d775990`) added `trpc.providers.listModels.useQuery()` and `trpc.workflow.currentModel.useQuery()` calls to `ChatInput`. The existing test mocks for `@/lib/trpc/client` don't include these new router methods.

---

## Proposed Fix

Add `providers.listModels` and `workflow.currentModel` mocks to the affected test files.

---

## Affected Files

- `packages/web/src/__tests__/components/chat/responsive.test.tsx`
- `packages/web/src/__tests__/components/chat/provider-status.test.tsx`

---

## Linked ADRs

- ADR-011-web-api-architecture

---

## Commits

No commits yet.

---

## Verification

- [ ] Bug no longer reproducible
- [ ] All 4 previously failing tests pass
- [ ] No new test failures introduced

---

## Reflection

**Why did this occur?**
The model selection feature added new tRPC calls to ChatInput but didn't update all test files that render ChatInput.

**What allowed it to reach this stage?**
Tests weren't run before committing the model selection feature, or the test failures were overlooked.

**How could it be prevented?**
Run full test suite before committing features that modify shared components.

**Suggested improvements**:
- Category: testing
- Description: Add pre-commit hook to run affected tests when modifying shared components

---

## Completion Notes

[Added when moved to done/]
