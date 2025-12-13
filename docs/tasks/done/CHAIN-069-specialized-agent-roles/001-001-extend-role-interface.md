# Task: Extend Role interface with model config

**Chain**: CHAIN-069-specialized-agent-roles  
**Task**: 001-001-extend-role-interface  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Extend the `Role` interface in `@choragen/core` to include model configuration (`model`) and system prompt (`systemPrompt`) fields. This enables each role to specify its own LLM settings.

---

## Expected Files

- `packages/core/src/roles/types.ts — Add RoleModelConfig interface and extend Role`
- `packages/core/src/roles/manager.ts — Update RoleManager to handle new fields`
- `packages/core/src/roles/index.ts — Export new types`

---

## File Scope

- `packages/core/src/roles/**`

---

## Acceptance Criteria

- [ ] RoleModelConfig interface defined with provider, model, temperature, and optional maxTokens
- [ ] Role interface extended with optional model?: RoleModelConfig field
- [ ] Role interface extended with optional systemPrompt?: string field
- [ ] RoleManager.get() returns roles with model config when present in YAML
- [ ] Existing roles without model config continue to work (backward compatible)
- [ ] Types exported from @choragen/core

---

## Notes

Reference ADR-014 and the design doc at `docs/design/core/features/specialized-agent-roles.md` for the interface definitions.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
