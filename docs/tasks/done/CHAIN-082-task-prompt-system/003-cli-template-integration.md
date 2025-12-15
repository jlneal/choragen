# Task: Integrate task templates with choragen task:add command

**Chain**: CHAIN-082-task-prompt-system  
**Task**: 003-cli-template-integration  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Extend the `choragen task:add` CLI command to support a `--template <name>` option that loads a task template from `templates/task-templates/` and populates the task with the template's `defaultPrompt`.

---

## Context

Current `task:add` implementation is at `packages/cli/src/cli.ts` lines 945-973. The command currently accepts `<chain-id> <slug> <title>` arguments.

New behavior:
- `choragen task:add <chain-id> <slug> <title> --template generic`
- Loads `templates/task-templates/generic.yaml`
- Interpolates `defaultPrompt` with task context
- Writes populated prompt to task file

---

## Expected Files

- `packages/cli/src/cli.ts` - Modified task:add command
- `packages/cli/src/utils/task-templates.ts` - Template loading utility
- Integration tests

---

## File Scope

- `packages/cli/src/`
- `packages/cli/src/__tests__/`

---

## Acceptance Criteria

- [ ] `task:add` accepts `--template <name>` option
- [ ] Template is loaded from `templates/task-templates/<name>.yaml`
- [ ] `defaultPrompt` is interpolated with task context
- [ ] Populated prompt is written to task file (new section or field)
- [ ] Error handling for missing/invalid templates
- [ ] Integration test verifies end-to-end flow

---

## Notes

- Decide where prompt goes in task file: new `## Prompt` section or metadata field
- Consider backward compatibility: existing tasks without templates should work unchanged

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
