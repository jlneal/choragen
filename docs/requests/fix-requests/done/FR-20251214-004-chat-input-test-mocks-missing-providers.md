# Fix Request: Chat Input Test Mocks Missing Providers Router

**ID**: FR-20251214-004  
**Domain**: web  
**Status**: done  
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

- `c9d34ec` fix(web): add missing providers and currentModel mocks to chat tests [FR-20251214-004]

---

## Verification

- [x] Bug no longer reproducible
- [x] All 4 previously failing tests pass
- [x] No new test failures introduced (307/307 pass)

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

Added `providers.listModels` and `workflow.currentModel` mocks to the tRPC client mocks in:
- `responsive.test.tsx`
- `provider-status.test.tsx`

All 307 tests now pass.
