# Fix Request: Webpack __webpack_require__ 'call' undefined error in @choragen/web

**ID**: FR-20251214-001  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-14  
**Severity**: high  
**Owner**: agent  

---

## Problem

When loading pages in `@choragen/web`, a server error occurs:

```
TypeError: Cannot read properties of undefined (reading 'call')
```

The error originates from `webpack-runtime.js` in the `__webpack_require__` function, specifically when trying to load client components that import types from `@choragen/core`.

---

## Expected Behavior

Pages should load without webpack module resolution errors. Client components should be able to use types from shared packages without bundling issues.

---

## Actual Behavior

Server crashes with `TypeError: Cannot read properties of undefined (reading 'call')` when webpack tries to resolve modules for client-side rendering.

---

## Steps to Reproduce

1. Start the web dev server: `pnpm --filter @choragen/web dev`
2. Navigate to any page that uses client components importing from `@choragen/core`
3. Observe the webpack runtime error

---

## Root Cause Analysis

`@choragen/core` contains Node.js-specific imports (`node:fs`, `node:path`, `node:crypto`, etc.) throughout its modules. When client components in `@choragen/web` import types from `@choragen/core` (even with `import type`), webpack attempts to bundle the entire module for client-side rendering.

The `transpilePackages: ["@choragen/core"]` config in `next.config.mjs` causes Next.js to process the package, but the Node.js APIs are not available in the browser environment, causing the webpack module resolution to fail.

Key files with Node.js dependencies in `@choragen/core`:
- `workflow/persistence.ts` - `node:fs`, `node:path`
- `feedback/FeedbackManager.ts` - `node:fs`, `node:path`, `node:crypto`
- `governance/governance-parser.ts` - `node:fs`
- Many others

Client components importing from `@choragen/core`:
- `components/chat/message-item.tsx`
- `components/chat/chat-container.tsx`
- `components/feedback/FeedbackPanel.tsx`
- Many others

---

## Proposed Fix

Configure Next.js 14 to externalize `@choragen/core` using `experimental.serverComponentsExternalPackages`:

```javascript
const nextConfig = {
  // Only transpile client-safe packages
  transpilePackages: ["@choragen/contracts"],

  // Externalize @choragen/core for server-side only
  experimental: {
    serverComponentsExternalPackages: ["@choragen/core"],
  },

  reactStrictMode: true,
};
```

**Important**: `@choragen/core` must be removed from `transpilePackages` because Next.js 14 does not allow a package to be in both `transpilePackages` and `serverComponentsExternalPackages`.

This tells Next.js to:
1. Not bundle `@choragen/core` for client components
2. Use native Node.js require for server components importing the package

Client components using `import type` from `@choragen/core` continue to work since TypeScript strips type-only imports at compile time.

---

## Affected Files

- `packages/web/next.config.mjs`

---

## Linked ADRs

- ADR-011-web-api-architecture

---

## Commits

No commits yet.

---

## Verification

- [ ] Bug no longer reproducible
- [ ] Regression test added
- [ ] Related functionality still works

---

## Reflection

**Why did this occur?**
The `@choragen/core` package was designed for server-side/CLI use with Node.js APIs. When `@choragen/web` was created, type imports were added to client components without considering the bundling implications.

**What allowed it to reach this stage?**
The `transpilePackages` config was added to support monorepo imports but `serverExternalPackages` was not configured to prevent client-side bundling.

**How could it be prevented?**
- Separate client-safe types into `@choragen/contracts`
- Add ESLint rule to warn about importing from `@choragen/core` in client components
- Document which packages are client-safe vs server-only

**Suggested improvements**:
- Category: architecture
- Description: Consider moving shared types to `@choragen/contracts` for client-safe imports

---

## Completion Notes

[Added when moved to done/]
