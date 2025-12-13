# Fix Request: Workflow Template Selection Bug

**ID**: FR-20251212-001  
**Domain**: core  
**Status**: todo  
**Severity**: high  
**Created**: 2025-12-12  

---

## Problem

The `workflowRouter.create` procedure in `packages/web/src/server/routers/workflow.ts` hardcodes the template to `"standard"`, ignoring the template name provided in the input.

```typescript
// Current (broken):
const template = await loadTemplate(ctx.projectRoot, "standard");

// Should be:
const template = await loadTemplate(ctx.projectRoot, input.template);
```

This prevents testing any workflow template other than "standard" (e.g., "hotfix", "documentation", "ideation").

---

## Expected Behavior

When creating a workflow with a specific template name, that template should be loaded and used.

---

## Steps to Reproduce

1. Call `workflowRouter.create` with `{ template: "hotfix", ... }`
2. Observe that the created workflow uses the "standard" template stages instead of "hotfix"

---

## Fix

Single-line change in `packages/web/src/server/routers/workflow.ts`:

```diff
- const template = await loadTemplate(ctx.projectRoot, "standard");
+ const template = await loadTemplate(ctx.projectRoot, input.template);
```

---

## Affected Files

- `packages/web/src/server/routers/workflow.ts`

---

## Commits

No commits yet.

---

## Completion Notes

[Added when moved to done/]
