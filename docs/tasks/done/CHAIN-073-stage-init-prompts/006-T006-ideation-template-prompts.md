# Task: Add init prompts to all stages in ideation.yaml

**Chain**: CHAIN-073-stage-init-prompts  
**Task**: 006-T006-ideation-template-prompts  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14
**Completed**: 2025-12-14

---

## Objective

Add `initPrompt` fields to all 3 stages in `ideation.yaml` template. Each prompt should guide the ideation workflow from exploration through proposal to request creation.

---

## Expected Files

- `templates/workflow-templates/ideation.yaml — Add initPrompt to all 3 stages`

---

## File Scope

- `templates/workflow-templates/ideation.yaml`

---

## Acceptance Criteria

- [x] `exploration` stage has initPrompt for idea exploration and refinement
- [x] `proposal` stage has initPrompt for formalizing proposals
- [x] `creation` stage has initPrompt for creating request documents
- [x] All prompts use template variables where appropriate ({{requestId}}, {{workflowId}}, etc.)
- [x] YAML syntax is valid
- [x] `pnpm build` passes

---

## Completion Notes

Added stage-specific initPrompt guidance to all 3 ideation workflow stages with template variables and responsibilities for exploration, proposal, and request creation.

**Files Modified**:
- `templates/workflow-templates/ideation.yaml` — Added initPrompt to exploration, proposal, creation stages

**Verification**: Build passes (turbo cached).
