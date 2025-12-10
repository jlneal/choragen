# Task: Promote/Demote Operations

**Chain**: CHAIN-049  
**Task**: T002  
**Type**: impl  
**Status**: done  
**Request**: CR-20251209-024  

---

## Objective

Implement tRPC procedures to move requests between backlog and todo states.

---

## Acceptance Criteria

1. Implement `requests.promote({ requestId })` — moves request from `backlog/` to `todo/`
2. Implement `requests.demote({ requestId })` — moves request from `todo/` to `backlog/`
3. Promote appends to end of todo (FIFO queue behavior)
4. Update request file's `**Status**:` field when moving
5. Unit tests for both operations (success and error cases)

---

## Implementation Guide

### 1. Add tRPC Procedures

In `packages/web/src/server/routers/requests.ts`:

```typescript
promote: publicProcedure
  .input(z.object({ requestId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    // 1. Find request file in backlog/
    // 2. Update status field in file content
    // 3. Move file to todo/
    // 4. Return updated request
  }),

demote: publicProcedure
  .input(z.object({ requestId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    // 1. Find request file in todo/
    // 2. Update status field in file content
    // 3. Move file to backlog/
    // 4. Return updated request
  }),
```

### 2. File Operations

- Use `fs.readFile` to read content
- Update `**Status**: backlog` → `**Status**: todo` (or vice versa)
- Use `fs.rename` to move file between directories

### 3. Unit Tests

Create `packages/web/src/__tests__/routers/backlog.test.ts`:

- Test promote from backlog to todo
- Test demote from todo to backlog
- Test error when request not found
- Test error when request in wrong state (e.g., promote from todo)

---

## Files to Modify

- `packages/web/src/server/routers/requests.ts` — Add promote/demote mutations

## Files to Create

- `packages/web/src/__tests__/routers/backlog.test.ts`

---

## Notes

Depends on T001 (backlog directories must exist).
