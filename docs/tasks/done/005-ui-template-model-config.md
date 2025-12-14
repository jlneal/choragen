# Task: Add Model Config to Template Editor

**Chain**: CR-20251214-001  
**Task**: 005  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Add model configuration to the workflow template editor, allowing users to set default models per stage.

---

## Context

Workflow templates define stages. Each stage should have an optional `defaultModel` that:
1. Pre-selects the model when that stage becomes active
2. Can be overridden at runtime via the chat model selector
3. Is saved with the template

---

## Expected Files

- `packages/web/src/components/templates/stage-editor.tsx` — Add model field
- `packages/web/src/components/templates/model-picker.tsx` — Reusable model picker
- `packages/web/src/server/routers/templates.ts` — Update save/load to include model

---

## Acceptance Criteria

- [x] Stage editor shows model picker field
- [x] Model picker shows available models from configured providers
- [x] Selected model saved to template stage `defaultModel`
- [x] Templates load with model configuration intact
- [x] "No default" option available (inherits from previous stage or system default)
- [x] Validation prevents selecting unavailable models

---

## Constraints

- Reuse model fetching logic from Task 004
- Template schema must remain backward compatible

---

## Notes

Depends on Task 001 for types and Task 002 for provider abstraction.

This completes the model selection feature. After this task, users can:
1. Configure default models per stage in templates
2. Override models at runtime in chat
3. See which model generated each message
