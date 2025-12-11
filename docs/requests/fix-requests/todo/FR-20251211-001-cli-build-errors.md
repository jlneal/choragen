# Fix Request: CLI Build Errors - @choragen/core Module Resolution

**ID**: FR-20251211-001  
**Domain**: cli  
**Status**: todo  
**Severity**: high  
**Created**: 2025-12-11  
**Owner**: agent  

---

## Problem

The `@choragen/cli` package fails to build with 53 TypeScript errors, all related to `@choragen/core` module resolution:

```
Cannot find module '@choragen/core' or its corresponding type declarations.
```

This prevents:
- Running `choragen init` in new projects
- Using CLI commands outside the monorepo
- Building the CLI for distribution

---

## Steps to Reproduce

```bash
cd /Users/justin/Projects/choragen
pnpm build
```

Expected: All packages build successfully  
Actual: `@choragen/cli` fails with 53 errors

---

## Error Summary

53 errors across 36 files, all variants of:

```typescript
// src/cli.ts:16
import { ChainManager, TaskManager, ... } from "@choragen/core";
//                                              ~~~~~~~~~~~~~~~~
// error TS2307: Cannot find module '@choragen/core' or its corresponding type declarations.
```

Affected files include:
- `src/cli.ts`
- `src/commands/*.ts`
- `src/menu/*.ts`
- `src/runtime/*.ts`
- `src/runtime/tools/definitions/*.ts`
- Various test files

---

## Root Cause Analysis

Likely causes:
1. **Missing build order** — `@choragen/core` may not be built before `@choragen/cli`
2. **TypeScript project references** — May be misconfigured
3. **Package.json exports** — `@choragen/core` exports may not be correctly configured
4. **tsconfig paths** — Path mapping may be incorrect

---

## Acceptance Criteria

- [ ] `pnpm build` completes successfully for all packages
- [ ] `@choragen/cli` can import from `@choragen/core`
- [ ] CLI commands work when run from outside the monorepo
- [ ] `choragen init` works in new projects

---

## Affected Files

- `packages/cli/tsconfig.json`
- `packages/cli/package.json`
- `packages/core/package.json` (exports field)
- Potentially `turbo.json` (build order)

---

## Investigation Notes

When running `pnpm build`:
- `@choragen/core` builds successfully (cached)
- `@choragen/contracts` builds successfully (cached)
- `@choragen/test-utils` builds successfully (cached)
- `@choragen/web` builds successfully (cached)
- `@choragen/cli` fails with module resolution errors

The issue appears to be specific to how `@choragen/cli` resolves `@choragen/core` during TypeScript compilation.

---

## Completion Notes

[Added when moved to done/ - summary of what was actually fixed]
