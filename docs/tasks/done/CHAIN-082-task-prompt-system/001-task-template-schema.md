# Task: Define task template YAML schema with defaultPrompt field

**Chain**: CHAIN-082-task-prompt-system  
**Task**: 001-task-template-schema  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Create the `templates/task-templates/` directory structure and define the YAML schema for task templates. The schema must include a `defaultPrompt` field that supports variable interpolation using `{{variable}}` syntax.

---

## Context

This task establishes the foundation for CR-20251214-008 (Task Prompt System). The schema design should align with existing workflow templates in `templates/workflow-templates/` which already use `{{variable}}` interpolation.

Reference: `templates/workflow-templates/standard.yaml` for existing variable patterns.

---

## Expected Files

- `templates/task-templates/` directory
- `templates/task-templates/schema.md` - Schema documentation

---

## File Scope

- `templates/task-templates/`

---

## Acceptance Criteria

- [ ] `templates/task-templates/` directory exists
- [ ] Schema documentation defines required fields: `name`, `type`, `defaultPrompt`
- [ ] Schema supports optional fields: `description`, `constraints`, `expectedFiles`
- [ ] Variable interpolation syntax documented: `{{taskId}}`, `{{taskTitle}}`, `{{chainId}}`, `{{requestId}}`, `{{domain}}`, `{{acceptanceCriteria}}`, `{{objective}}`, `{{context}}`

---

## Notes

- Align with existing `{{VARIABLE}}` syntax in `templates/task.md`
- Consider TypeScript interface for schema validation in future task

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
