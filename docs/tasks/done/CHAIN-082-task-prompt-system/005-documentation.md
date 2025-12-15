# Task: Update templates/AGENTS.md with task template documentation

**Chain**: CHAIN-082-task-prompt-system  
**Task**: 005-documentation  
**Status**: done  
**Type**: control  
**Created**: 2025-12-14

---

## Objective

Update `templates/AGENTS.md` to document the new task template system, including schema, available variables, and usage examples.

---

## Context

The existing `templates/AGENTS.md` documents workflow templates and document templates. Add a new section for task templates that follows the same documentation style.

---

## Expected Files

- `templates/AGENTS.md` - Updated with task template documentation

---

## File Scope

- `templates/AGENTS.md`

---

## Acceptance Criteria

- [ ] New "Task Templates" section added to `templates/AGENTS.md`
- [ ] Schema fields documented: `name`, `type`, `defaultPrompt`, optional fields
- [ ] All core variables documented with descriptions
- [ ] Usage example showing `choragen task:add --template` command
- [ ] Link to `templates/task-templates/` directory

---

## Notes

- This task can be completed by control agent directly
- Follow existing documentation style in the file

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
