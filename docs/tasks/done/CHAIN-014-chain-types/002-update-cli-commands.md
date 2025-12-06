# Task: Update CLI Commands for Chain Types

**Chain**: CHAIN-014-chain-types  
**Task**: 002-update-cli-commands  
**Type**: implementation  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Update CLI commands to support chain types, including `--type` flag and shorthand commands.

---

## Expected Files

Update:
- `packages/cli/src/commands/chain.ts` (or equivalent)

---

## Changes Required

1. Update `chain:new` command:
   ```bash
   # With --type flag
   choragen chain:new CR-xxx my-feature "Title" --type=design
   choragen chain:new CR-xxx my-feature "Title" --type=implementation
   
   # Shorthand commands
   choragen chain:new:design CR-xxx my-feature "Title"
   choragen chain:new:impl CR-xxx my-feature "Title"
   ```

2. Add `--skip-design` flag for hotfixes:
   ```bash
   choragen chain:new:impl FR-xxx hotfix "Hotfix" --skip-design="Critical production issue"
   ```

3. Update `chain:status` to show type and dependencies

4. Update `chain:list` to show type column

---

## Acceptance Criteria

- [ ] `chain:new` accepts `--type` flag
- [ ] `chain:new:design` shorthand works
- [ ] `chain:new:impl` shorthand works
- [ ] `--skip-design` flag with required justification
- [ ] `chain:status` shows type
- [ ] `chain:list` shows type column
- [ ] Help text updated

---

## Verification

```bash
pnpm build
pnpm --filter @choragen/cli test
choragen chain:new --help
```
