# ADR-005: Design Contract API

**Status**: Done  
**Created**: 2025-12-07  
**Linked CR**: CR-20251206-012  
**Linked Design Docs**: docs/design/core/features/design-contract.md

---

## Context

We need runtime traceability at API boundaries to:

1. **Link code to design** — Every handler should reference its governing design document
2. **Enable tooling** — ESLint rules and tests should verify contract presence
3. **Support inspection** — Metadata should be accessible at runtime for debugging and auditing
4. **Maintain simplicity** — The API should be easy to adopt without significant refactoring

---

## Decision

Adopt a **function wrapper API** with metadata attachment:

### DesignContract Function

```typescript
import { DesignContract } from "@choragen/contracts";

export const GET = DesignContract({
  designDoc: "docs/design/core/features/task-management.md",
  handler: async (request: Request) => {
    return Response.json({ tasks: [] });
  },
});
```

### Key Properties

- **Transparent wrapping** — Wrapped handlers behave identically to original handlers
- **Metadata attachment** — Design doc path is accessible via helper functions
- **Type preservation** — TypeScript types flow through the wrapper correctly
- **Inspectable** — `isDesignContract()` and `getDesignContractMetadata()` helpers for tooling

### DesignContractBuilder (Advanced)

For runtime validation of inputs and outputs, use the Builder pattern:

```typescript
const contract = new DesignContractBuilder<Input, Output>({
  designDoc: "docs/design/...",
  userIntent: "Create a task",
})
  .pre((input) => input.title ? null : "Title required")
  .post((output) => output.id ? null : "Must return ID");
```

---

## Consequences

**Positive**:

- **Simple API** — Single function call wraps any handler
- **Matches documentation** — Design doc path mirrors file system structure
- **Inspectable** — Runtime access to metadata for tooling and tests
- **Non-invasive** — Can be adopted incrementally without refactoring existing handlers

**Negative**:

- **Limited runtime validation** — Basic wrapper doesn't validate inputs/outputs (use Builder for that)
- **Manual path maintenance** — Design doc paths must be updated if files move
- **No compile-time verification** — Path validity is only checked at runtime or by linting

**Mitigations**:

- DesignContractBuilder provides full validation when needed
- ESLint rules verify design doc paths exist
- Validation scripts check path validity in CI

---

## Alternatives Considered

### Alternative 1: Class-Only API

Require handlers to extend a base class with design doc metadata.

```typescript
class TaskHandler extends DesignContractHandler {
  static designDoc = "docs/design/...";
  async handle(request: Request) { ... }
}
```

**Rejected because**: Forces class-based architecture, doesn't work well with Next.js/Remix route conventions that expect exported functions.

### Alternative 2: Decorator Pattern

Use TypeScript decorators to attach metadata.

```typescript
@DesignContract("docs/design/...")
export async function GET(request: Request) { ... }
```

**Rejected because**: Decorators are still experimental in TypeScript, and function decorators have limited support. Would require enabling experimental features.

---

## Implementation

- `packages/contracts/src/design-contract.ts`
