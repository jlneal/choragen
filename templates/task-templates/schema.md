# Task Template YAML Schema

Task templates define reusable prompts for tasks. Each template lives in `templates/task-templates/` as a YAML file and is referenced by its `name`.

## Required fields
- `name` — String identifier for the template (typically matches the filename without extension).
- `type` — String describing the task category (e.g., `impl`, `control`, `review`).
- `defaultPrompt` — Multi-line string that supports `{{variable}}` interpolation. Use the same double-brace syntax as workflow templates (see `templates/workflow-templates/standard.yaml` for reference).

## Optional fields
- `description` — Freeform text summarizing when to use the template.
- `constraints` — Array of strings that should be surfaced alongside the prompt.
- `expectedFiles` — Array of strings describing expected output artifacts or file paths.

## Variable interpolation
The `defaultPrompt` field can embed the following variables, which will be resolved when a task is instantiated:
- `{{taskId}}`
- `{{taskTitle}}`
- `{{chainId}}`
- `{{requestId}}`
- `{{domain}}`
- `{{acceptanceCriteria}}`
- `{{objective}}`
- `{{context}}`

## Example
```yaml
name: generic
type: impl
description: General-purpose implementation task template
constraints:
  - Keep acceptance criteria visible while working.
expectedFiles:
  - docs/tasks/todo/{{chainId}}/{{taskId}}-notes.md
defaultPrompt: |
  You are working on task {{taskId}} ({{taskTitle}}) in chain {{chainId}} for request {{requestId}} ({{domain}} domain).

  Objective:
  {{objective}}

  Acceptance criteria:
  {{acceptanceCriteria}}

  Context:
  {{context}}
```
