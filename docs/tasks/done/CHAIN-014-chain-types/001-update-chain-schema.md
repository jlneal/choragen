# Task: Update Chain Schema with Type Field

**Chain**: CHAIN-014-chain-types  
**Task**: 001-update-chain-schema  
**Type**: implementation  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add `type` field to chain metadata schema to distinguish design chains from implementation chains.

---

## Expected Files

Update:
- `packages/core/src/schemas/chain.ts` (or wherever chain schema is defined)

Create if needed:
- Type definitions for chain types

---

## Changes Required

1. Add `type` field to chain metadata:
   ```typescript
   type ChainType = 'design' | 'implementation';
   
   interface ChainMetadata {
     chainId: string;
     requestId: string;
     title: string;
     type: ChainType;  // NEW
     status: ChainStatus;
     dependsOn?: string;  // NEW - for impl chains depending on design chains
     createdAt: string;
     tasks: string[];
   }
   ```

2. Make `type` required for new chains, optional for backward compatibility during migration

---

## Acceptance Criteria

- [ ] `type` field added to chain schema
- [ ] `dependsOn` field added for chain dependencies
- [ ] Types exported for use in CLI
- [ ] Existing code still compiles
- [ ] Tests pass

---

## Verification

```bash
pnpm build
pnpm --filter @choragen/core test
pnpm --filter @choragen/core typecheck
```
