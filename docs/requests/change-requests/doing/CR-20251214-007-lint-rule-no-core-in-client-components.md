# Change Request: ESLint rule to prevent @choragen/core imports in client components

**ID**: CR-20251214-007  
**Domain**: eslint-plugin  
**Status**: todo  
**Created**: 2025-12-14  
**Owner**: agent  

---

## Description

Add an ESLint rule `no-core-in-client-component` that prevents runtime imports from `@choragen/core` in Next.js client components (files with `"use client"` directive).

---

## Motivation

`@choragen/core` contains Node.js-specific APIs (`node:fs`, `node:path`, `node:crypto`) that cannot be bundled for client-side rendering. When client components import from this package, webpack fails with:

```
TypeError: Cannot read properties of undefined (reading 'call')
```

This error is cryptic and hard to debug. A lint rule would catch violations at development time with a clear error message.

---

## In Scope

- New ESLint rule: `@choragen/no-core-in-client-component`
- Detect `"use client"` directive in files
- Flag non-type imports from `@choragen/core`
- Allow `import type { ... } from "@choragen/core"` (stripped at compile time)
- Suggest using `@choragen/contracts` for runtime values
- Add rule to recommended config for `@choragen/web`

---

## Out of Scope

- Detecting other server-only packages (can be added later)
- Auto-fix capability (too complex to automatically refactor)

---

## Acceptance Criteria

- [ ] Rule detects `"use client"` directive at file start
- [ ] Rule flags `import { X } from "@choragen/core"` in client components
- [ ] Rule allows `import type { X } from "@choragen/core"` 
- [ ] Rule allows all imports in files without `"use client"`
- [ ] Error message suggests using `@choragen/contracts` or `import type`
- [ ] Rule has comprehensive test coverage
- [ ] Rule is enabled in `@choragen/web` eslint config

---

## Example

```typescript
// ❌ Error: Runtime import from @choragen/core in client component
"use client";
import { FeedbackManager } from "@choragen/core";

// ✅ Correct: Type-only import (stripped at compile time)
"use client";
import type { WorkflowMessage, FeedbackItem } from "@choragen/core";

// ✅ Correct: Use @choragen/contracts for runtime values
"use client";
import { HttpStatus } from "@choragen/contracts";

// ✅ Correct: Server component can import anything
import { FeedbackManager } from "@choragen/core";
```

---

## Linked FRs

- FR-20251214-001 (webpack __webpack_require__ error that motivated this rule)

---

## Linked ADRs

- ADR-002-governance-schema (code hygiene enforcement)

---

## Commits

No commits yet.
