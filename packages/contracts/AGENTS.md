# @choragen/contracts

Shared contracts, types, and utilities for design-driven development.

## Purpose

Provides the primitives that enforce design-to-implementation traceability:

- **DesignContract**: Wrapper that links API routes to design documents
- **ApiError**: Standardized error type with HTTP status codes
- **HttpStatus**: Enum of HTTP status codes (avoids magic numbers)

## Key Exports

### DesignContract

```typescript
import { DesignContract } from "@choragen/contracts";

export const GET = DesignContract({
  designDoc: "docs/design/core/features/task-management.md",
  handler: async (request: Request) => {
    // Implementation
  },
});
```

### ApiError

```typescript
import { ApiError, HttpStatus } from "@choragen/contracts";

throw new ApiError("Task not found", HttpStatus.NOT_FOUND);
```

### HttpStatus

```typescript
import { HttpStatus } from "@choragen/contracts";

// Use enum constants instead of magic numbers
expect(response.status).toBe(HttpStatus.OK); // 200
expect(response.status).toBe(HttpStatus.CREATED); // 201
expect(response.status).toBe(HttpStatus.NOT_FOUND); // 404
```

## Directory Structure

```
src/
├── design-contract.ts
├── api-error.ts
├── http-status.ts
└── index.ts
```

## Coding Conventions

- All exports are pure TypeScript (no runtime dependencies)
- Types are exported alongside implementations
- No side effects on import

## Common Patterns

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

### Test Assertions

```typescript
import { HttpStatus } from "@choragen/contracts";

// ✅ CORRECT: Use enum constants
expect(response.status).toBe(HttpStatus.OK);

// ❌ WRONG: Magic numbers trigger lint errors
expect(response.status).toBe(200);
```

## Related ADRs

- **ADR-002**: Governance schema design (DesignContract enforces traceability)

## Testing

```bash
pnpm --filter @choragen/contracts test
pnpm --filter @choragen/contracts typecheck
```
