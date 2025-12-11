# Task: Create tRPC workflow router scaffold with basic CRUD procedures

**Chain**: CHAIN-060-web-runtime-bridge  
**Task**: 001-workflow-router-scaffold  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Create the tRPC `workflowRouter` that exposes the `WorkflowManager` from `@choragen/core` to the web app. This router provides the API layer for starting, monitoring, and controlling workflows from the web dashboard.



---

## Expected Files

- `packages/web/src/server/routers/workflow.ts` — New tRPC router
- `packages/web/src/server/routers/index.ts` — Add workflow router to appRouter
- `packages/web/src/__tests__/routers/workflow.test.ts` — Unit tests


---

## Acceptance Criteria

- [x] `workflowRouter` created with ADR reference comment
- [x] `workflow.create` mutation — starts workflow from requestId + template
- [x] `workflow.get` query — returns full workflow state by ID
- [x] `workflow.list` query — returns workflows filtered by status/requestId/template
- [x] `workflow.sendMessage` mutation — adds message to workflow
- [x] `workflow.satisfyGate` mutation — marks gate as satisfied
- [x] `workflow.getHistory` query — returns paginated message history
- [x] `workflow.updateStatus` mutation — pause/cancel workflow
- [x] Router added to `appRouter` in index.ts
- [x] Unit tests pass (13 tests)
- [x] `pnpm --filter @choragen/web typecheck` passes


---

## Notes

### Reference Files

- **Existing router pattern**: `packages/web/src/server/routers/sessions.ts`
- **WorkflowManager**: `packages/core/src/workflow/manager.ts`
- **Workflow types**: `packages/core/src/workflow/types.ts`
- **Router index**: `packages/web/src/server/routers/index.ts`

### Key Types from @choragen/core

```typescript
import { WorkflowManager, type Workflow, type WorkflowStatus, type MessageRole } from "@choragen/core";
```

### Router Structure

Follow the pattern in `sessions.ts`:
1. ADR comment at top: `// ADR: ADR-011-web-api-architecture`
2. Create helper to instantiate `WorkflowManager` from `ctx.projectRoot`
3. Use zod for input validation
4. Use `TRPCError` for error handling

### Procedures to Implement

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `create` | mutation | `{ requestId, template }` | `Workflow` |
| `get` | query | `workflowId` | `Workflow` |
| `list` | query | `{ status?, requestId?, template? }` | `Workflow[]` |
| `sendMessage` | mutation | `{ workflowId, role, content, stageIndex }` | `Workflow` |
| `satisfyGate` | mutation | `{ workflowId, stageIndex, satisfiedBy }` | `Workflow` |
| `getHistory` | query | `{ workflowId, limit?, offset? }` | `WorkflowMessage[]` |
| `updateStatus` | mutation | `{ workflowId, status }` | `Workflow` |

### Template Handling

For `workflow.create`, the template should be a `WorkflowTemplate` object. For now, accept a template name string and use a hardcoded "standard" template. Real template loading will come in a later task.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
