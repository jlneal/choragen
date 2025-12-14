# Task: Update AGENTS.md to remove stage-specific guidance

**Chain**: CHAIN-073-stage-init-prompts  
**Task**: 009-T009-update-agents-md  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14
**Completed**: 2025-12-14

---

## Objective

Update AGENTS.md to remove stage-specific guidance that is now provided via initPrompt fields in workflow templates. AGENTS.md should focus on general conventions, not workflow-specific behavior.

---

## Expected Files

- `AGENTS.md — Remove stage-specific instructions`
- `docs/agents/control-agent.md — Review and update if needed`
- `docs/agents/impl-agent.md — Review and update if needed`

---

## File Scope

- `AGENTS.md`
- `docs/agents/control-agent.md`
- `docs/agents/impl-agent.md`

---

## Acceptance Criteria

- [x] AGENTS.md contains only general conventions (project structure, role boundaries, commit discipline, validation commands)
- [x] Stage-specific instructions removed from AGENTS.md (now in initPrompt)
- [x] Workflow-specific behavior removed from AGENTS.md (now in templates)
- [x] Tool usage guidance removed if duplicated (now in tool descriptions or role prompts)
- [x] Agent role docs updated if they contain stage-specific guidance
- [x] `pnpm build` passes

---

## Completion Notes

Trimmed stage-specific guidance from the root agent guide, leaving only general conventions and references to per-package docs. Simplified the control agent guide by removing workflow/stage sequencing details, keeping responsibilities and boundaries for control-only tasks. Reviewed the implementation agent guide; it already focuses on general task execution so no changes were needed.

**Files Modified**:
- `AGENTS.md` — Removed stage-specific instructions, kept general conventions
- `docs/agents/control-agent.md` — Simplified, removed workflow sequencing details
- `docs/agents/impl-agent.md` — No changes needed (already general)

**Verification**: Build passes (turbo cached).
