# Task: Enable ESLint Enforcement

**Chain**: CHAIN-016-agentic-chassis  
**Task**: 003-eslint-enforcement  
**Type**: implementation  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Wire up `@choragen/eslint-plugin` to enforce rules on the choragen codebase itself. Dogfood our own rules.

---

## Expected Files

Update:
- `eslint.config.mjs` (already exists, needs to use our plugin)

Create if needed:
- Any missing configuration

---

## Changes Required

1. **Update `eslint.config.mjs`** to use `@choragen/eslint-plugin`:
   ```javascript
   import chorgenPlugin from "@choragen/eslint-plugin";
   
   export default [
     // ... existing config
     {
       plugins: {
         "@choragen": chorgenPlugin,
       },
       rules: {
         // Enable our rules
         "@choragen/require-adr-reference": "warn",
         "@choragen/require-cr-fr-exists": "error",
         "@choragen/no-untracked-todos": "warn",
         // ... etc
       },
     },
   ];
   ```

2. **Decide which rules to enable**:
   - Some rules are for application code (API routes, components)
   - Some rules are universal (no-untracked-todos, require-cr-fr-exists)
   - Start with universal rules, add more as appropriate

3. **Fix any violations** that the rules catch

4. **Add to pre-commit hook** (if not already):
   ```bash
   pnpm lint
   ```

---

## Acceptance Criteria

- [ ] `eslint.config.mjs` imports `@choragen/eslint-plugin`
- [ ] At least 5 rules enabled (universal ones)
- [ ] `pnpm lint` runs without errors
- [ ] Pre-commit runs lint on staged files

---

## Verification

```bash
pnpm lint
pnpm build
```
