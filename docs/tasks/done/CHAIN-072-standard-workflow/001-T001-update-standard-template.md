# Task: Update standard.yaml with 8 stages

**Chain**: CHAIN-072-standard-workflow  
**Task**: 001-T001-update-standard-template  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Update the `templates/workflow-templates/standard.yaml` template to implement the 8-stage workflow as defined in the design doc. The current template has only 5 stages; the new version needs: planning, design, impl-planning, implementation, verification, commit, request-review, and completion.

---

## Expected Files

- `templates/workflow-templates/standard.yaml` — Updated workflow template

---

## File Scope

- `templates/workflow-templates/standard.yaml`

---

## Acceptance Criteria

- [x] Template has 8 stages: planning, design, impl-planning, implementation, verification, commit, request-review, completion
- [x] Each stage has appropriate role assignment (orchestration, design, implementation, commit, review, control)
- [x] Each stage has appropriate gate type (human_approval, chain_complete, verification_pass)
- [x] Planning stage has onEnter hook to move request from todo/ to doing/
- [x] Design and implementation stages have onEnter hooks for agent spawning
- [x] Completion stage has onExit hooks for request closure and chain archival
- [x] Template matches structure in docs/design/core/features/standard-workflow.md

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
