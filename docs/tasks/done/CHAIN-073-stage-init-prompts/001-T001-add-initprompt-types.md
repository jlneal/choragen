# Task: Add initPrompt field to WorkflowStage and WorkflowTemplateStage types

**Chain**: CHAIN-073-stage-init-prompts  
**Task**: 001-T001-add-initprompt-types  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14  
**Completed**: 2025-12-14

---

## Objective

Add the `initPrompt` optional field to both `WorkflowStage` and `WorkflowTemplateStage` types. This field will hold stage-specific instructions that are injected into agent context when a stage activates.

---

## Completion Notes

Added optional `initPrompt` to workflow stages with documentation and ensured it's carried from templates into created workflows. Extended template parsing/validation and YAML serialization to read/write `initPrompt` from stage definitions. Updated template API schema to accept `initPrompt` for stages. Strengthened tests to verify `initPrompt` parsing and preservation.

**Files Modified**:
- `packages/core/src/workflow/types.ts`
- `packages/core/src/workflow/manager.ts`
- `packages/core/src/workflow/templates.ts`
- `packages/core/src/workflow/template-manager.ts`
- `packages/web/src/server/routers/workflow-template.ts`
- `packages/core/src/workflow/__tests__/templates.test.ts`
- `packages/core/src/workflow/__tests__/manager.test.ts`

**Verification**: Build passes, 541 tests pass.
