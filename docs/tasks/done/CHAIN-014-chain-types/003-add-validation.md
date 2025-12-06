# Task: Add Chain Type Validation

**Chain**: CHAIN-014-chain-types  
**Task**: 003-add-validation  
**Type**: implementation  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add validation to enforce chain type rules: requests need both design and implementation chains, impl chains blocked until design chain done.

---

## Expected Files

Create:
- `packages/core/src/validation/chain-types.ts`
- `scripts/validate-chain-types.mjs`

Update:
- `packages/cli/src/commands/request.ts` (add `request:validate` command)

---

## Changes Required

1. Create validation logic:
   ```typescript
   // Validate request has required chain types
   function validateRequestChains(requestId: string): ValidationResult {
     // Check for design chain
     // Check for implementation chain
     // Check impl chain has dependsOn pointing to design chain
     // Check design chain is done before impl can start
   }
   ```

2. Add `request:validate` CLI command:
   ```bash
   choragen request:validate CR-20251206-001
   # Error: Missing implementation chain
   # Error: Design chain incomplete
   ```

3. Create validation script for CI:
   ```bash
   node scripts/validate-chain-types.mjs
   ```

---

## Acceptance Criteria

- [ ] Validation detects missing design chain
- [ ] Validation detects missing implementation chain
- [ ] Validation checks impl blocked until design done
- [ ] `request:validate` command works
- [ ] Validation script for CI
- [ ] `--skip-design` chains exempt from design requirement

---

## Verification

```bash
pnpm build
pnpm --filter @choragen/core test
node scripts/validate-chain-types.mjs
```
