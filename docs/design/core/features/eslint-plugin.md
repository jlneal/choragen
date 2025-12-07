# Feature: ESLint Plugin

**Domain**: core  
**Created**: 2025-12-07  
**Status**: Implemented  

---

## Overview

The `@choragen/eslint-plugin` provides ESLint rules that enforce choragen conventions and design traceability at development time. Rules catch violations early, before code reaches review or production.

---

## Rule Categories

### Traceability Rules

Ensure code links back to design artifacts:

| Rule | Description |
|------|-------------|
| `require-adr-reference` | Source files must reference governing ADR |
| `require-test-metadata` | Test files must have `@design-doc` tag |
| `no-untracked-todos` | TODOs/FIXMEs must reference CR/FR |
| `require-new-file-traceability` | New files must have traceability comment |
| `require-bidirectional-test-links` | Tests and implementations must link to each other |
| `require-cr-fr-exists` | Referenced CR/FR must exist |
| `require-design-doc-chain` | Design docs must form complete chain |
| `require-design-doc-completeness` | Design docs must have required sections |
| `require-adr-implementation` | ADRs must have implementation references |
| `require-adr-relevance` | ADRs must be relevant to current code |
| `require-significant-change-traceability` | Large changes need traceability |

### Contract Rules

Enforce DesignContract usage:

| Rule | Description |
|------|-------------|
| `require-design-contract` | API routes must use DesignContract wrapper |
| `require-postcondition-semantics` | Postconditions must be meaningful |
| `require-precondition-semantics` | Preconditions must be meaningful |
| `no-trivial-contract-conditions` | Contract conditions must not be trivial |

### Code Hygiene Rules

Enforce code quality standards:

| Rule | Description |
|------|-------------|
| `no-as-unknown` | Disallow `as unknown as T` type casts |
| `no-magic-numbers-http` | Use HttpStatus enum instead of numeric literals |
| `require-eslint-disable-justification` | Disable comments must have justification |
| `max-eslint-disables-per-file` | Limit disable comments per file |
| `max-eslint-disables-ratio` | Limit disable comments relative to file size |
| `require-error-handler` | Functions must handle errors |
| `require-try-catch-in-async` | Async functions need try/catch |
| `require-error-boundary` | React components need error boundaries |
| `require-readonly-properties` | Prefer readonly properties |

### Test Quality Rules

Ensure meaningful test coverage:

| Rule | Description |
|------|-------------|
| `no-trivial-assertions` | Assertions must be meaningful |
| `require-test-assertions` | Tests must have assertions |
| `require-meaningful-test-coverage` | Tests must cover meaningful scenarios |
| `require-semantic-user-intent` | Tests must express user intent |
| `require-test-exercises-component` | Component tests must exercise component |
| `require-test-exercises-route` | Route tests must exercise route |
| `require-test-for-api-route` | API routes must have tests |
| `require-test-for-component` | Components must have tests |
| `require-test-for-lib-export` | Library exports must have tests |

---

## Configuration Presets

### Recommended Config

Warnings for most rules - good for gradual adoption:

```javascript
// eslint.config.mjs
import choragen from "@choragen/eslint-plugin";

export default [
  choragen.configs.recommended,
];
```

### Strict Config

Errors for all rules - enforces full compliance:

```javascript
// eslint.config.mjs
import choragen from "@choragen/eslint-plugin";

export default [
  choragen.configs.strict,
];
```

### Individual Rules

Enable specific rules:

```javascript
// eslint.config.mjs
import choragen from "@choragen/eslint-plugin";

export default [
  {
    plugins: { "@choragen": choragen },
    rules: {
      "@choragen/require-design-contract": "error",
      "@choragen/no-magic-numbers-http": "error",
      "@choragen/require-test-metadata": "warn",
    },
  },
];
```

---

## Key Rules in Detail

### require-design-contract

API route handlers must be wrapped in DesignContract:

```typescript
// ❌ Error
export const GET = async (request: Request) => {};

// ✅ Correct
export const GET = DesignContract({
  designDoc: "docs/design/core/features/task-management.md",
  handler: async (request: Request) => {},
});
```

### no-magic-numbers-http

Use HttpStatus enum instead of numeric literals:

```typescript
// ❌ Error
expect(response.status).toBe(200);
throw new ApiError("Not found", 404);

// ✅ Correct
expect(response.status).toBe(HttpStatus.OK);
throw new ApiError("Not found", HttpStatus.NOT_FOUND);
```

### require-test-metadata

Test files must have `@design-doc` JSDoc tag:

```typescript
// ❌ Error: Missing @design-doc
describe("TaskManager", () => {});

// ✅ Correct
/**
 * @design-doc docs/design/core/features/task-management.md
 * @test-type unit
 */
describe("TaskManager", () => {});
```

### no-untracked-todos

TODOs and FIXMEs must reference a CR or FR:

```typescript
// ❌ Error
// TODO: Fix this later

// ✅ Correct
// TODO(CR-20251207-001): Fix this later
// FIXME(FR-20251207-002): Handle edge case
```

---

## Linked Scenarios

- [Implementation Agent Workflow](../scenarios/implementation-agent-workflow.md)

---

## Linked ADRs

- [ADR-002: Governance Schema](../../adr/done/ADR-002-governance-schema.md)

---

## Acceptance Criteria

- [ ] Traceability rules enforce ADR references and design doc links
- [ ] Contract rules enforce DesignContract usage on API routes
- [ ] Code hygiene rules catch unsafe patterns (as unknown, magic numbers)
- [ ] Test quality rules ensure meaningful test coverage
- [ ] Recommended config provides warnings for gradual adoption
- [ ] Strict config provides errors for full enforcement

---

## Implementation

- `packages/eslint-plugin/src/index.ts`
