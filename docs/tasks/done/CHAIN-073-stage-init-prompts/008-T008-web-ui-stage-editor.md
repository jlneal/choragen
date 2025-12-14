# Task: Add initPrompt field to stage editor in web UI

**Chain**: CHAIN-073-stage-init-prompts  
**Task**: 008-T008-web-ui-stage-editor  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14
**Completed**: 2025-12-14

---

## Objective

Add `initPrompt` field to the web UI stage editor so users can view and edit stage initialization prompts when creating or editing workflow templates.

---

## Expected Files

- `packages/web/src/components/workflows/template-form.tsx — Add initPrompt?: string to TemplateStageInput type`
- `packages/web/src/components/workflows/stage-editor.tsx — Add textarea field for initPrompt`
- `packages/web/src/server/routers/workflow-template.ts — Ensure initPrompt is included in schema`

---

## File Scope

- `packages/web/src/components/workflows/template-form.tsx`
- `packages/web/src/components/workflows/stage-editor.tsx`
- `packages/web/src/server/routers/workflow-template.ts`

---

## Acceptance Criteria

- [x] `TemplateStageInput` type includes `initPrompt?: string`
- [x] Stage editor displays initPrompt textarea when editable
- [x] Stage editor displays initPrompt text when read-only
- [x] initPrompt is saved when template is created/updated
- [x] `pnpm build` passes
- [x] `pnpm --filter @choragen/web typecheck` passes

---

## Completion Notes

Added initPrompt support to web template editing: TemplateStageInput now carries the field and trims it on submit, and the stage editor renders an editable textarea or read-only view for the init prompt. Schema already allowed initPrompt.

**Files Modified**:
- `packages/web/src/components/workflows/template-form.tsx` — Added initPrompt to type, trim on submit
- `packages/web/src/components/workflows/stage-editor.tsx` — Added Init Prompt textarea field

**Verification**: Build passes.
