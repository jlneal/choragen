# Task: Add invokeAgent tRPC Mutation

**Chain**: CHAIN-066-agent-invocation-web  
**Task ID**: 002  
**Type**: impl  
**Status**: done  
**Depends On**: 001

---

## Objective

Add a `workflow.invokeAgent` tRPC mutation that spawns an agent session for the current workflow stage.

---

## Acceptance Criteria

- [ ] `invokeAgent` mutation added to workflow router
- [ ] Accepts workflowId and optional message content
- [ ] Validates workflow exists and is in valid state
- [ ] Returns session ID for tracking
- [ ] Input schema validated with zod

---

## Implementation Notes

**File**: `packages/web/src/server/routers/workflow.ts`

```typescript
const invokeAgentInputSchema = z.object({
  workflowId: z.string().min(1),
  message: z.string().optional(), // Optional initial message
});

// Add to workflowRouter:
invokeAgent: publicProcedure
  .input(invokeAgentInputSchema)
  .mutation(async ({ ctx, input }) => {
    // 1. Get workflow, validate state
    // 2. Spawn agent session (task 003)
    // 3. Return session tracking info
  }),
```

This task creates the mutation shell. Task 003 implements the actual agent spawning.

---

## Verification

```bash
pnpm --filter @choragen/web test
# Verify mutation exists and validates input
```
