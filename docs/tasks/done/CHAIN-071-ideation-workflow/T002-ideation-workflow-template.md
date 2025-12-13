# Task: Create Ideation Workflow Template

**Chain**: CHAIN-071-ideation-workflow  
**Task**: T002  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Create the `ideation.yaml` workflow template with three stages: exploration, proposal, and creation. This template defines the structure for ideation workflows.

---

## Context

The ideation workflow has three stages:
1. **exploration** — Understand and scope the idea (human_approval gate with discard option)
2. **proposal** — Propose request structure (human_approval gate)
3. **creation** — Draft and create request docs (auto gate)

Design doc: `docs/design/core/features/ideation-workflow.md` (see Workflow Template section)

---

## Expected Files

- `templates/workflow-templates/ideation.yaml`

---

## Acceptance Criteria

- [ ] `ideation.yaml` created with three stages
- [ ] exploration stage has human_approval gate with discard option
- [ ] proposal stage has human_approval gate
- [ ] creation stage has auto gate with onExit hooks for file moves
- [ ] Template follows existing patterns in `templates/workflow-templates/standard.yaml`
- [ ] YAML is valid and parseable

---

## Constraints

- Follow existing workflow template conventions
- Gate options must include "discard" action for exploration stage
- Use "ideation" as stage type (may need to add to StageType enum)

---

## Notes

Reference the template structure from the design doc:

```yaml
name: ideation
displayName: Ideation Workflow
description: Explore and refine ideas into actionable requests

stages:
  - name: exploration
    type: ideation
    role: ideation
    gate:
      type: human_approval
      prompt: "Continue to request creation, or discard this idea?"
      options:
        - label: Continue
          action: advance
        - label: Discard
          action: discard
  # ... etc
```
