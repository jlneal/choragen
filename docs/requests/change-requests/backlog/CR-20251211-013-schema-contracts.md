# Change Request: Schema Contracts

**ID**: CR-20251211-013  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Add schema-based runtime contracts using Zod for API boundary validation, external data parsing, and structured response verification.

---

## Why

Schema contracts complement function contracts by validating data at boundaries:

- **API responses**: Ensure endpoints return data matching their schema
- **External input**: Validate data from external sources before use
- **Integration points**: Verify third-party API responses match expectations

This is especially valuable for agent-generated API routes where the response shape must match the documented contract.

---

## Scope

**In Scope**:
- `apiContract` wrapper for API routes with response validation
- Zod schema integration for request/response validation
- Integration with existing `DesignContract` from `@choragen/contracts`
- Schema violation capture with full context
- Request body validation
- Query parameter validation
- Path parameter validation

**Out of Scope**:
- Web dashboard (CR-20251211-014)
- Workflow integration (CR-20251211-015)
- Non-Zod schema libraries (future enhancement)

---

## Acceptance Criteria

- [ ] `apiContract({ response: Schema, handler })` validates responses
- [ ] `apiContract({ request: Schema, handler })` validates request bodies
- [ ] `apiContract({ query: Schema, handler })` validates query params
- [ ] `apiContract({ params: Schema, handler })` validates path params
- [ ] Schema violations captured as contract violations
- [ ] Integration with `DesignContract` for combined traceability + validation
- [ ] Works with Next.js App Router API routes
- [ ] Works with tRPC procedures
- [ ] Violations include: schema path, expected type, received value
- [ ] `choragen contracts` lists schema contracts

---

## Affected Design Documents

- [Runtime Contract Enforcement](../../../design/core/features/runtime-contract-enforcement.md)

---

## Linked ADRs

- ADR-014: Runtime Contract Enforcement

---

## Dependencies

- **CR-20251211-012**: Contracts Core Infrastructure (violation capture)

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create:

```
packages/contracts/src/
├── schema/
│   ├── index.ts
│   ├── api-contract.ts         # apiContract wrapper
│   ├── validators.ts           # Request/response validators
│   └── zod-adapter.ts          # Zod integration
└── __tests__/
    └── schema.test.ts
```

Usage example:

```typescript
import { z } from "zod";
import { apiContract, DesignContract } from "@choragen/contracts";

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
});

// Standalone schema contract
export const GET = apiContract({
  response: UserSchema,
  handler: async (request) => {
    const user = await db.getUser(request.params.id);
    return user; // Validated against UserSchema
  },
});

// Combined with DesignContract
export const POST = DesignContract({
  designDoc: "docs/design/core/features/users.md",
  handler: apiContract({
    request: z.object({ email: z.string().email(), name: z.string() }),
    response: UserSchema,
    handler: async (request) => {
      const body = await request.json();
      const user = await db.createUser(body);
      return user;
    },
  }),
});
```

Violation context for schema errors:
```typescript
{
  contractId: "POST /api/users response",
  type: "schema",
  message: "Response validation failed",
  context: {
    path: "email",
    expected: "string (email)",
    received: "invalid-email",
    zodError: { ... }
  }
}
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
