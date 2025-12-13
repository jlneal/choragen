# Task: Create roles/index.yaml with eight specialized roles

**Chain**: CHAIN-069-specialized-agent-roles  
**Task**: 002-002-create-roles-yaml  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Create `.choragen/roles/index.yaml` with definitions for all eight specialized roles, including their tool assignments, model configurations, and system prompts.

---

## Expected Files

- `.choragen/roles/index.yaml — Role definitions with model config and system prompts`

---

## File Scope

- `.choragen/roles/**`

---

## Acceptance Criteria

- [ ] Eight roles defined: control, ideation, design, orchestration, implementation, review, commit, researcher
- [ ] Each role has: id, name, description, toolIds array
- [ ] Each role has model config: provider (anthropic), model (claude-sonnet-4-20250514), temperature
- [ ] Temperature values per design doc: commit=0.1, orchestration=0.2, impl/control/review=0.3, design=0.4, researcher=0.5, ideation=0.7
- [ ] Each role has systemPrompt field with role-specific behavioral guidance
- [ ] Tool assignments match design doc specifications
- [ ] YAML validates and loads correctly via RoleManager

---

## Notes

Reference the role definitions in `docs/design/core/features/specialized-agent-roles.md` for exact tool assignments and system prompt content.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
