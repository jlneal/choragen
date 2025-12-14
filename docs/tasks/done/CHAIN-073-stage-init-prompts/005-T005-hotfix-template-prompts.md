# Task: Add init prompts to all stages in hotfix.yaml

**Chain**: CHAIN-073-stage-init-prompts  
**Task**: 005-T005-hotfix-template-prompts  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14
**Completed**: 2025-12-14

---

## Objective

Add `initPrompt` fields to all 4 stages in `hotfix.yaml` template. Each prompt should provide stage-specific instructions for the expedited hotfix workflow.

---

## Expected Files

- `templates/workflow-templates/hotfix.yaml — Add initPrompt to all 4 stages`

---

## File Scope

- `templates/workflow-templates/hotfix.yaml`

---

## Acceptance Criteria

- [x] `request` stage has initPrompt for FR creation and triage
- [x] `implementation` stage has initPrompt for rapid fix implementation
- [x] `verification` stage has initPrompt for verification process
- [x] `completion` stage has initPrompt for merge and closure
- [x] All prompts use template variables where appropriate ({{requestId}}, {{chainId}}, etc.)
- [x] YAML syntax is valid
- [x] `pnpm build` passes

---

## Completion Notes

Added stage-specific initPrompt blocks to all 4 hotfix workflow stages, using template variables and emphasizing triage, minimal-scope implementation, verification, and final approval.

**Files Modified**:
- `templates/workflow-templates/hotfix.yaml` — Added initPrompt to request, implementation, verification, completion stages

**Verification**: Build passes (cached).
