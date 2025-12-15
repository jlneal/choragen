# Task: Create example task templates including generic.yaml

**Chain**: CHAIN-082-task-prompt-system  
**Task**: 004-example-templates  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Create example task templates demonstrating the schema and `defaultPrompt` feature. At minimum, create a `generic.yaml` template that works for general implementation tasks.

---

## Context

Templates should provide useful, actionable prompts that guide agents through task execution. Reference the workflow template prompts in `templates/workflow-templates/standard.yaml` for style guidance.

---

## Expected Files

- `templates/task-templates/generic.yaml` - General-purpose implementation template
- `templates/task-templates/design.yaml` - Design task template (optional, for CR-20251214-009)
- `templates/task-templates/review.yaml` - Review task template (optional)

---

## File Scope

- `templates/task-templates/`

---

## Acceptance Criteria

- [ ] `generic.yaml` exists with valid schema
- [ ] `defaultPrompt` provides actionable guidance for implementation tasks
- [ ] Variables are used appropriately: `{{taskId}}`, `{{objective}}`, `{{acceptanceCriteria}}`
- [ ] Templates are valid YAML and parseable

---

## Notes

- Keep prompts concise but comprehensive
- Include role declaration reminder per AGENTS.md guidelines
- Consider including verification steps in prompt

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
