# Task: Add init prompts to all stages in documentation.yaml

**Chain**: CHAIN-073-stage-init-prompts  
**Task**: 007-T007-documentation-template-prompts  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14
**Completed**: 2025-12-14

---

## Objective

Add `initPrompt` fields to all 3 stages in `documentation.yaml` template. Each prompt should guide documentation-only workflows.

---

## Expected Files

- `templates/workflow-templates/documentation.yaml — Add initPrompt to all 3 stages`

---

## File Scope

- `templates/workflow-templates/documentation.yaml`

---

## Acceptance Criteria

- [x] `request` stage has initPrompt for documentation request setup
- [x] `implementation` stage has initPrompt for documentation work
- [x] `completion` stage has initPrompt for review and approval
- [x] All prompts use template variables where appropriate ({{requestId}}, {{workflowId}}, etc.)
- [x] YAML syntax is valid
- [x] `pnpm build` passes

---

## Completion Notes

Added stage-specific initPrompt guidance to all 3 documentation workflow stages, covering setup, documentation implementation, and final review with template variables.

**Files Modified**:
- `templates/workflow-templates/documentation.yaml` — Added initPrompt to request, implementation, completion stages

**Verification**: Build passes (turbo cached).
