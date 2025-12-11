# Task: Workflow Templates

**Chain**: CHAIN-059-workflow-orchestration  
**Task**: T003  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Implement workflow template loading and provide default templates.

---

## Context

Workflow templates define the stages and gates for different types of work. Templates are YAML files stored in `.choragen/workflow-templates/`.

---

## Expected Files

- `packages/core/src/workflow/templates.ts`
- `templates/workflow-templates/standard.yaml`
- `templates/workflow-templates/hotfix.yaml`
- `templates/workflow-templates/documentation.yaml`

---

## Acceptance Criteria

- [x] `loadTemplate(name)` loads template from `.choragen/workflow-templates/`
- [x] `loadTemplate(name)` falls back to built-in templates if not found locally
- [x] `listTemplates()` returns available template names
- [x] `validateTemplate(template)` validates template structure
- [x] Default `standard` template: request → design → implementation → verification → completion
- [x] Default `hotfix` template: request → implementation → verification → completion
- [x] Default `documentation` template: request → implementation → completion
- [x] Templates define gate types and prompts for each stage
- [x] Unit tests for template loading and validation

---

## Constraints

- Use YAML format for templates (consistent with governance config)
- Templates must be valid before workflow creation
- Built-in templates bundled with package

---

## Notes

Template YAML structure per design doc:
```yaml
name: standard
stages:
  - name: request
    type: request
    gate:
      type: human_approval
      prompt: "CR created. Proceed to design?"
```

---

## Completion Notes

**Completed**: 2025-12-10

Files created:
- `packages/core/src/workflow/templates.ts` — Template loader, lister, validator, built-in templates, simple YAML parser
- `templates/workflow-templates/standard.yaml` — Standard 5-stage workflow
- `templates/workflow-templates/hotfix.yaml` — Hotfix 4-stage workflow
- `templates/workflow-templates/documentation.yaml` — Documentation 3-stage workflow
- `packages/core/src/workflow/__tests__/templates.test.ts` — Tests for loading, validation, and fallback

Files updated:
- `packages/core/src/workflow/manager.ts` — Reuse shared template types
- `packages/core/src/workflow/index.ts` — Export templates module

Features:
- YAML parsing for template files
- Built-in fallback when local templates not found
- Template validation before use
- Full test coverage
