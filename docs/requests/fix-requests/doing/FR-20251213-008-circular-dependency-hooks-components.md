# Fix Request: Circular Dependencies in Web Components

**ID**: FR-20251213-008  
**Domain**: web  
**Status**: doing  
**Created**: 2025-12-13  
**Severity**: high  
**Owner**: agent  

---

## Problem

Multiple pages crash with webpack runtime error due to circular dependencies between modules.

---

## Expected Behavior

All pages should load without errors.

---

## Actual Behavior

Runtime error: `TypeError: Cannot read properties of undefined (reading 'call')` in webpack module resolution on metrics and workflows pages.

---

## Steps to Reproduce

1. Navigate to the metrics or workflows page in the web dashboard
2. Observe webpack runtime error in browser console
3. Error occurs during module initialization

---

## Root Cause Analysis

**Issue 1: Metrics page**
Circular dependency chain:
1. `@/hooks/index.ts` → exports from `use-metrics.ts`
2. `use-metrics.ts` → imports types from `@/components/metrics`
3. `@/components/metrics/index.ts` → exports from `time-range-filter.tsx`
4. `time-range-filter.tsx` → imports from `@/hooks/use-time-range`

**Issue 2: Workflows page**
Circular dependency chain:
1. `template-form.tsx` → imports `StageList` from `./stage-list`
2. `stage-list.tsx` → imports `StageEditor` from `./stage-editor` AND imports types from `./template-form`
3. `stage-editor.tsx` → imports types from `./template-form`

When webpack tries to resolve these cycles, modules are not yet initialized, causing the `undefined.call` error.

---

## Proposed Fix

1. **Metrics**: Define chart data point types in `use-metrics.ts` instead of importing from components
2. **Workflows**: Extract shared types/constants to a new `types.ts` file

---

## Affected Files

- `packages/web/src/hooks/use-metrics.ts`
- `packages/web/src/hooks/index.ts`
- `packages/web/src/components/metrics/index.ts`
- `packages/web/src/components/metrics/task-completion-chart.tsx`
- `packages/web/src/components/metrics/rework-trend-chart.tsx`
- `packages/web/src/components/workflows/types.ts` (new)
- `packages/web/src/components/workflows/template-form.tsx`
- `packages/web/src/components/workflows/stage-editor.tsx`
- `packages/web/src/components/workflows/stage-list.tsx`

---

## Linked ADRs

- ADR-011-web-api-architecture

---

## Commits

No commits yet.

---

## Verification

- [x] Bug no longer reproducible
- [ ] Regression test added
- [x] Related functionality still works (typecheck and build pass)

---

## Completion Notes

[Added when moved to done/]
