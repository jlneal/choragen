# Task: Update agent runtime to resolve model config from role

**Chain**: CHAIN-069-specialized-agent-roles  
**Task**: 003-003-runtime-model-resolution  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Update the agent runtime to resolve model configuration from the role definition. When spawning an agent session, the runtime should use the role's model config (provider, model, temperature) instead of global defaults.

---

## Expected Files

- `packages/cli/src/runtime/loop.ts — Resolve model config from role before creating provider`
- `packages/cli/src/runtime/providers/factory.ts — Accept role model config overrides (may need creation)`
- `packages/cli/src/commands/agent.ts — Pass role model config through session config`

---

## File Scope

- `packages/cli/src/runtime/**`
- `packages/cli/src/commands/agent.ts`

---

## Acceptance Criteria

- [ ] runAgentSession resolves role by ID and extracts model config
- [ ] Role's model.provider overrides default provider selection
- [ ] Role's model.model overrides default model selection
- [ ] Role's model.temperature is passed to provider
- [ ] Roles without model config fall back to environment/default settings
- [ ] choragen agent command respects role model config when --role is specified
- [ ] Logging shows which model config is being used

---

## Notes

Depends on task 001 (Role interface extension) and task 002 (roles YAML). The provider factory may need a new function to create providers with role-specific config.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
