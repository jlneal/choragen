# Feature: Design Contract

**Domain**: core  
**Created**: 2025-12-07  
**Status**: Implemented  

---

## Overview

DesignContract provides runtime traceability by linking API route handlers to their governing design documents. This enables tooling and tests to verify that every handler has a documented design specification.

---

## Purpose

The DesignContract wrapper serves multiple purposes:

- **Runtime traceability** - Links code to design docs at runtime
- **Tooling support** - ESLint rules can verify contract presence
- **Test verification** - Tests can inspect handler metadata
- **Documentation** - Self-documenting code that references its specification

---

## Function Wrapper API

The primary API is the `DesignContract` function that wraps handlers:

```typescript
import { DesignContract } from "@choragen/contracts";

export const GET = DesignContract({
  designDoc: "docs/design/core/features/task-management.md",
  handler: async (request: Request) => {
    return Response.json({ tasks: [] });
  },
});
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `designDoc` | `string` | Path to the governing design document |
| `handler` | `(request: TRequest) => TResponse \| Promise<TResponse>` | The actual route handler |

### Return Value

Returns a `WrappedHandler` that:
- Behaves identically to the original handler
- Carries metadata accessible via helper functions
- Can be inspected by tooling and tests

---

## DesignContractBuilder (Advanced)

For runtime validation of inputs and outputs, use `DesignContractBuilder`:

```typescript
import { DesignContractBuilder } from "@choragen/contracts";

interface TaskInput { title: string; }
interface TaskOutput { id: string; title: string; }

const contract = new DesignContractBuilder<TaskInput, TaskOutput>({
  designDoc: "docs/design/core/features/task-management.md",
  userIntent: "Create a new task",
})
  .pre((input) => input.title ? null : "Title is required")
  .post((output) => output.id ? null : "Must return ID");
```

### Builder Methods

| Method | Description |
|--------|-------------|
| `pre(check)` | Add a precondition validator |
| `post(check)` | Add a postcondition validator |
| `validateInput(input)` | Validate input against preconditions |
| `validateOutput(output)` | Validate output against postconditions |
| `getMetadata()` | Get contract metadata for tracing |

### Validation Results

```typescript
// Precondition violation
const inputResult = contract.validateInput({ title: "" });
// { success: false, violations: ["Title is required"] }

// Successful validation
const outputResult = contract.validateOutput({ id: "123", title: "Test" });
// { success: true, data: { id: "123", title: "Test" } }
```

---

## Helper Functions

### isDesignContract

Check if a handler is wrapped with DesignContract:

```typescript
import { isDesignContract } from "@choragen/contracts";

if (isDesignContract(handler)) {
  // handler has design contract metadata
}
```

### getDesignContractMetadata

Extract metadata from a wrapped handler:

```typescript
import { getDesignContractMetadata } from "@choragen/contracts";

const metadata = getDesignContractMetadata(handler);
if (metadata) {
  console.log(metadata.designDoc); // "docs/design/..."
}
```

---

## Usage Patterns

### API Route with Contract

```typescript
import { DesignContract, ApiError, HttpStatus } from "@choragen/contracts";

export const POST = DesignContract({
  designDoc: "docs/design/core/features/governance-enforcement.md",
  handler: async (request: Request) => {
    const body = await request.json();

    if (!body.action) {
      throw new ApiError("Missing action", HttpStatus.BAD_REQUEST);
    }

    return Response.json({ success: true }, { status: HttpStatus.CREATED });
  },
});
```

### Test Verification

```typescript
import { isDesignContract, getDesignContractMetadata } from "@choragen/contracts";

describe("API Routes", () => {
  it("should have design contract", () => {
    expect(isDesignContract(GET)).toBe(true);
    
    const metadata = getDesignContractMetadata(GET);
    expect(metadata?.designDoc).toContain("docs/design/");
  });
});
```

---

## Linked Use Cases

- [Create and Execute Task Chain](../use-cases/create-execute-task-chain.md)

---

## Linked ADRs

- [ADR-002: Governance Schema](../../adr/done/ADR-002-governance-schema.md)
- [ADR-005: Design Contract API](../../adr/done/ADR-005-design-contract-api.md)

---

## Acceptance Criteria

- [ ] DesignContract wraps handlers with design doc metadata
- [ ] Wrapped handlers behave identically to original handlers
- [ ] isDesignContract correctly identifies wrapped handlers
- [ ] getDesignContractMetadata extracts metadata from wrapped handlers
- [ ] DesignContractBuilder supports pre/postcondition validation
- [ ] Validation results include success status and violations

---

## Implementation

- `packages/contracts/src/design-contract.ts`
