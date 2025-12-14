# Task: Register rule and enable in configs

**Chain**: CHAIN-081-require-chain-design-dependency  
**Task**: 005-register-rule  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Register the new rule in the eslint-plugin index and enable it in the recommended config for `@choragen/core` and `@choragen/cli`.

---

## Expected Files

- `packages/eslint-plugin/src/rules/index.ts (modify)`
- `eslint.config.mjs (modify, if needed)`

---

## File Scope

- `packages/eslint-plugin/src/rules/index.ts`
- `eslint.config.mjs`

---

## Acceptance Criteria

- [ ] Rule imported in `packages/eslint-plugin/src/rules/index.ts`
- [ ] Rule exported in the rules object with key `"require-chain-design-dependency"`
- [ ] Rule enabled in eslint config (if applicable)
- [ ] `pnpm build` succeeds
- [ ] `pnpm lint` passes (or only has unrelated warnings)
- [ ] `pnpm --filter @choragen/eslint-plugin test` passes

---

## Notes

Follow the pattern of existing rule registrations in `index.ts`.

The rule should be added to the "Traceability rules" section since it enforces chain traceability.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
