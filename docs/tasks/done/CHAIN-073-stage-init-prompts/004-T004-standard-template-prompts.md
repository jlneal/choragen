# Task: Add init prompts to all stages in standard.yaml

**Chain**: CHAIN-073-stage-init-prompts  
**Task**: 004-T004-standard-template-prompts  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14
**Completed**: 2025-12-14

---

## Objective

Add `initPrompt` fields to all 8 stages in `standard.yaml` template. Each prompt should provide stage-specific instructions that guide the agent's behavior.

---

## Expected Files

- `templates/workflow-templates/standard.yaml — Add initPrompt to all 8 stages`

---

## File Scope

- `templates/workflow-templates/standard.yaml`

---

## Acceptance Criteria

- [x] planning stage has initPrompt explaining design chain creation
- [x] design stage has initPrompt for design implementation work
- [x] impl-planning stage has initPrompt for implementation chain creation
- [x] implementation stage has initPrompt for code implementation work
- [x] verification stage has initPrompt for verification process
- [x] commit stage has initPrompt for commit preparation
- [x] request-review stage has initPrompt for final review
- [x] completion stage has initPrompt for closure tasks
- [x] All prompts use template variables where appropriate ({{requestId}}, {{chainId}}, etc.)
- [x] YAML syntax is valid
- [x] pnpm build passes

---

## Completion Notes

Inserted stage-specific initPrompt blocks for all eight stages in standard.yaml, using template variables ({{requestId}}, {{chainId}}, {{stageName}}, {{stageType}}) and outlining responsibilities and gate expectations.

**Files Modified**:
- `templates/workflow-templates/standard.yaml` — Added initPrompt to all 8 stages (planning, design, impl-planning, implementation, verification, commit, request-review, completion)

**Verification**: Build passes.
