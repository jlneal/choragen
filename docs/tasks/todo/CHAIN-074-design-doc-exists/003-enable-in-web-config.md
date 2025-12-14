# Task: Enable require-design-contract in Web ESLint Config

**Chain**: CHAIN-074-design-doc-exists  
**Task**: 003-enable-in-web-config  
**Type**: impl  
**Status**: done  
**CR**: CR-20251214-004

---

## Objective

Enable the `require-design-contract` rule in the `@choragen/web` ESLint configuration.

## Context

The `require-design-contract` rule (which includes design doc existence validation) is not currently enabled in `packages/web/eslint.config.mjs`. Only `no-core-in-client-component` is enabled.

## Acceptance Criteria

- [x] `@choragen/require-design-contract` rule is enabled in web eslint config
- [x] Rule is configured appropriately for the web package
- [x] API routes wrapped with DesignContract (no new lint errors for require-design-contract)

## Implementation Summary

1. Enabled `@choragen/require-design-contract: "error"` in `packages/web/eslint.config.mjs`
2. Updated `@choragen/contracts` `DesignContractOptions` to allow `name`, `preconditions`, `postconditions` metadata fields
3. Wrapped API routes with DesignContract:
   - `packages/web/src/app/api/agent-stream/route.ts` → linked to `docs/design/core/features/agent-runtime.md`
   - `packages/web/src/app/api/trpc/[trpc]/route.ts` → linked to `docs/design/core/features/web-chat-interface.md`
4. Rebuilt contracts package to surface new typings

**Note**: Pre-existing lint issues in unrelated files (unused vars in chat tests/components) are separate from this CR.

## Implementation Notes

Add to `packages/web/eslint.config.mjs`:
```javascript
rules: {
  "@choragen/no-core-in-client-component": "error",
  "@choragen/require-design-contract": "error",  // Add this
}
```

If there are existing API routes without DesignContract wrappers, they will need to be updated or the rule configured to exclude certain paths.

## Files to Modify

- `packages/web/eslint.config.mjs`
- Potentially API route files if they need DesignContract wrappers

## Verification

```bash
pnpm --filter @choragen/web lint
```
