# Task: Add Core Model Types

**Chain**: CR-20251214-001  
**Task**: 001  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Add `ModelReference` type and update `WorkflowStage`, `WorkflowTemplateStage`, and `WorkflowMessage` to include model fields.

---

## Context

The workflow system currently has no model configuration. This task adds the foundational types that will be used by the provider abstraction and UI components.

Key design decisions:
- `ModelReference` is a simple `{ provider, model }` tuple
- Stage has `defaultModel?: ModelReference` for template-level defaults
- Message has `model?: ModelReference` to track which model generated it

---

## Expected Files

- `packages/core/src/workflow/types.ts` — Add `ModelReference`, update `WorkflowStage`, `WorkflowMessage`
- `packages/core/src/workflow/templates.ts` — Update `WorkflowTemplateStage` with `defaultModel`
- `packages/core/src/index.ts` — Export new types

---

## Acceptance Criteria

- [x] `ModelReference` interface defined with `provider: string` and `model: string`
- [x] `WorkflowStage` has optional `defaultModel?: ModelReference`
- [x] `WorkflowTemplateStage` has optional `defaultModel?: ModelReference`
- [x] `WorkflowMessage` has optional `model?: ModelReference`
- [x] New types exported from `@choragen/core`
- [x] `pnpm build` passes
- [x] `pnpm --filter @choragen/core typecheck` passes

---

## Constraints

- Do not change existing field semantics
- Keep types minimal — no provider-specific fields yet

---

## Notes

This is the foundation for CR-20251214-001. Subsequent tasks depend on these types.

---

## Completion Notes

Types already existed prior to CR creation:
- `ModelReference` at `packages/core/src/workflow/types.ts:65-71`
- `WorkflowStage.defaultModel` at line 336
- `WorkflowMessage.model` at line 375
- `WorkflowTemplateStage.defaultModel` at `packages/core/src/workflow/templates.ts:37`
- Export at `packages/core/src/index.ts:36`

Task marked complete — no implementation needed.
