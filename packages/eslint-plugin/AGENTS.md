# @choragen/eslint-plugin

ESLint rules that enforce choragen conventions and design traceability.

## Purpose

Provides lint rules that catch violations at development time:

- Missing design document references
- Magic numbers in test assertions
- Unsafe type casts
- Missing DesignContract wrappers on API routes

## Key Exports

### Plugin Configuration

```javascript
// eslint.config.mjs
import choragen from "@choragen/eslint-plugin";

export default [
  choragen.configs.recommended,
  // or individual rules:
  {
    plugins: { choragen },
    rules: {
      "choragen/require-design-contract": "error",
      "choragen/no-magic-http-status": "error",
      "choragen/require-test-design-doc": "error",
    },
  },
];
```

## Rules

### `require-design-contract`

API route handlers must be wrapped in `DesignContract`.

```typescript
// ❌ Error
export const GET = async (request: Request) => {};

// ✅ Correct
export const GET = DesignContract({
  designDoc: "docs/design/...",
  handler: async (request: Request) => {},
});
```

### `no-magic-http-status`

Use `HttpStatus` enum instead of numeric literals.

```typescript
// ❌ Error
expect(response.status).toBe(200);

// ✅ Correct
expect(response.status).toBe(HttpStatus.OK);
```

### `require-test-design-doc`

Test files must have `@design-doc` JSDoc tag.

```typescript
// ❌ Error: Missing @design-doc
describe("TaskManager", () => {});

// ✅ Correct
/**
 * @design-doc docs/design/core/features/task-management.md
 */
describe("TaskManager", () => {});
```

## Directory Structure

```
src/
├── rules/
│   ├── require-design-contract.ts
│   ├── no-magic-http-status.ts
│   └── require-test-design-doc.ts
├── configs/
│   └── recommended.ts
└── index.ts
```

## Coding Conventions

- Rules follow ESLint flat config format
- Each rule has comprehensive test coverage
- Error messages include fix suggestions where possible

## Related ADRs

- **ADR-002**: Governance schema design (rules enforce governance at lint time)

## Testing

```bash
pnpm --filter @choragen/eslint-plugin test
pnpm --filter @choragen/eslint-plugin typecheck
```
