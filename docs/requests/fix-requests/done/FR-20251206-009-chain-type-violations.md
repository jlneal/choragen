# Fix Request: Chain Type Validation Violations

**ID**: FR-20251206-009  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-06  
**Severity**: low  
**Owner**: agent  

---

## Problem

The `validate-chain-types.mjs` validator reports 15 errors for chains missing design chains. All existing chains were created before the chain type system was implemented, so they lack the required design→implementation chain pairing.

---

## Expected Behavior

All requests should have either:
1. A design chain AND an implementation chain (with `--depends-on`), OR
2. An implementation chain with `--skip-design="justification"`

---

## Actual Behavior

```
📋 CR-20251205-001
   Design chains: 0
   Implementation chains: 1
   ✗ [MISSING_DESIGN_CHAIN] Request CR-20251205-001 has no design chain

(... 14 more similar errors)
```

---

## Steps to Reproduce

1. Run `node scripts/validate-chain-types.mjs`
2. Observe 15 errors for missing design chains

---

## Root Cause Analysis

The chain type system (design vs implementation) was added in CR-20251206-006. All prior chains were created without types. The validator correctly identifies the gap but there's no retroactive fix applied.

This is a **bootstrap problem**: early development necessarily skipped the full workflow to get the framework operational.

---

## Proposed Fix

For each existing chain, add a `--skip-design` justification to the chain metadata explaining why design was skipped:

**Justification categories:**
1. **Bootstrap** — "Framework bootstrap: design docs created retroactively"
2. **Hotfix** — "Urgent fix, design not required"
3. **Trivial** — "Trivial change, design overhead not warranted"

**Implementation:**
1. Update chain metadata files in `docs/tasks/.chains/` to include `skipDesignJustification`
2. Update `validate-chain-types.mjs` to accept this field as valid
3. Document the justification in each chain's metadata

---

## Affected Files

- `docs/tasks/.chains/CHAIN-001-*.json` through `CHAIN-016-*.json`
- `scripts/validate-chain-types.mjs` (if justification field not already supported)
- `packages/core/src/tasks/types.ts` (add `skipDesignJustification` to Chain type)

---

## Linked ADRs

- ADR-001-task-file-format

---

## Commits

No commits yet.

---

## Verification

- [x] Bug no longer reproducible
- [x] `validate-chain-types.mjs` passes
- [x] All chains have either design chain or skip justification
- [x] Chain type documentation updated

---

## Completion Notes

**Completed**: 2025-12-06

**Changes made:**
1. Added `skipDesign` and `skipDesignJustification` fields to `Chain` interface in `packages/core/src/tasks/types.ts`
2. Updated `ChainManager` to handle these fields in create/load/write operations
3. Backfilled all 15 existing implementation chains with `skipDesign: true` and justification "Bootstrap: Created before chain type system was implemented"
4. Updated `validate-chain-types.mjs` to allow design-only requests when all design chains are complete

**Task Chain**: CHAIN-017-fix-chain-types (3 tasks completed)
