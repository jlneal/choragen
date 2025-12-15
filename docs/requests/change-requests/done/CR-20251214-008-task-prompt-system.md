# Change Request: Task Prompt System

**ID**: CR-20251214-008  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-14  
**Owner**: agent

---

## Description

Add support for default prompts in task templates. Task templates can define a `defaultPrompt` field that provides structured guidance to agents when they pick up a task. The prompt supports variable interpolation using the existing `{{variable}}` syntax.

---

## Motivation

Currently, tasks are structural documents (objective, acceptance criteria, constraints) but lack agent-facing guidance. Agents must infer how to approach the task. Default prompts provide:

1. **Consistency** — Same task type gets same guidance pattern
2. **Context injection** — Variables like `{{taskId}}`, `{{chainId}}`, `{{acceptanceCriteria}}` are auto-populated
3. **Reduced cognitive load** — Agents don't need to parse task structure; prompt tells them what to do
4. **Foundation for design workflow** — CR-20251214-009 depends on this for structured design chains

---

## Scope

### In Scope

- New `templates/task-templates/` directory for YAML task templates
- Task template schema with `defaultPrompt` field
- Variable interpolation system for task prompts
- Core variables: `{{taskId}}`, `{{taskTitle}}`, `{{chainId}}`, `{{requestId}}`, `{{domain}}`, `{{acceptanceCriteria}}`, `{{objective}}`, `{{context}}`
- CLI integration: `choragen task:add` uses template's default prompt when available
- Documentation updates

### Out of Scope

- Design workflow (separate CR-20251214-009)
- Workflow-level changes
- UI/chat integration (future work)

---

## Acceptance Criteria

- [x] `templates/task-templates/` directory exists with schema documentation
- [x] Task template YAML schema defined with `name`, `type`, `defaultPrompt` fields
- [x] Variable interpolation works for all core variables
- [x] `choragen task:add --template <name>` creates task with populated prompt
- [x] At least one example task template created (e.g., `generic.yaml`)
- [x] `templates/AGENTS.md` updated with task template documentation

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Variable interpolation conflicts with existing `{{}}` syntax | Low | Medium | Use same parser as workflow templates |
| Prompt bloat in task files | Medium | Low | Prompts stored in template, not task file; task file references template |

---

## Links

- **Depends on**: None
- **Blocks**: CR-20251214-009 (Design Workflow)
- **Related**: `templates/workflow-templates/*.yaml` (existing variable system)

---

## Completion Notes

**Completed**: 2025-12-14  
**Chain**: CHAIN-082-task-prompt-system

### Deliverables

- `templates/task-templates/schema.md` — Schema documentation
- `packages/core/src/utils/interpolation.ts` — `interpolateTaskPrompt` function with `TaskPromptContext`
- `packages/cli/src/utils/task-templates.ts` — Template loader with validation
- `packages/cli/src/cli.ts` — `task:add --template` integration
- `templates/task-templates/generic.yaml` — General implementation template
- `templates/task-templates/design.yaml` — Design task template
- `templates/task-templates/review.yaml` — Review task template
- `templates/AGENTS.md` — Updated with Task Templates section

### Tests

- `packages/core/src/utils/__tests__/interpolation.test.ts`
- `packages/cli/src/__tests__/cli.test.ts` (template integration test)
