# Change Request: Specialized Agent Roles

**ID**: CR-20251212-001  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-12  
**Completed**: 2025-12-12
**Owner**: agent  

---

## What

Implement specialized agent roles with distinct responsibilities, model configurations, and behavioral characteristics. This extends the existing role-based tool access system to define purpose-built agent personas:

- **Control** — Human interface for process control
- **Ideation** — Explores and refines ideas to produce requests
- **Design** — Creates design documents and ADRs
- **Orchestration** — Manages implementation chains and coordinates agents
- **Implementation** — Executes individual tasks
- **Review** — Reviews completed work for quality and correctness
- **Commit** — Handles version control operations
- **Researcher** — Read-only exploration and question answering

Each role includes model configuration (provider, model, temperature) and system prompt templates.

---

## Why

The current role system defines tool access but lacks behavioral differentiation. All agents use the same model and prompts regardless of their function. This limits:

1. **Optimization** — Can't tune temperature for creativity vs. precision
2. **Specialization** — No clear separation of concerns between agent types
3. **Context management** — No guidance on keeping agent focus narrow
4. **Cost control** — Can't assign different models to different roles

Specialized roles enable the assembly-line model where each agent has a clear, bounded responsibility.

---

## Scope

**In Scope**:
- Role definitions with model configuration (provider, model, temperature)
- System prompt templates for each role
- Eight specialized roles: Control, Ideation, Design, Orchestration, Implementation, Review, Commit, Researcher
- Agent runtime resolution of model config from role
- Web UI display of role model configuration

**Out of Scope**:
- Role inheritance/extension
- Dynamic temperature adjustment
- Multi-model fallback

---

## Affected Design Documents

- docs/design/core/features/specialized-agent-roles.md
- docs/design/core/features/role-based-tool-access.md

---

## Linked ADRs

- ADR-010: Agent Runtime Architecture
- ADR-014: Specialized Agent Roles

---

## Commits

- 77f723f feat(roles): implement specialized agent roles with model configuration

## Implementation Notes

Key implementation areas:
1. Extend `Role` interface in `@choragen/core` to include `model` and `systemPrompt`
2. Update `roles/index.yaml` schema to support new fields
3. Update agent runtime to resolve model config from role
4. Create default role definitions for all eight roles
5. Update web UI role editor to display/edit model config

---

## Completion Notes

Implemented all six tasks in CHAIN-069-specialized-agent-roles:

1. **Extended Role interface** — Added `model?: RoleModelConfig` and `systemPrompt?: string` fields to the Role type in `@choragen/core`
2. **Created roles YAML** — Defined 8 specialized roles in `.choragen/roles/index.yaml` with model configs (anthropic/claude-sonnet-4-20250514) and role-specific temperatures
3. **Runtime model resolution** — Agent runtime now resolves role model config and passes provider/model/temperature to LLM providers with legacy fallback support
4. **System prompt templates** — PromptLoader supports role systemPrompt with `{{chainId}}`, `{{taskId}}`, `{{toolSummaries}}` placeholders and `file:` references
5. **Web UI role config** — Role editor includes provider dropdown, model input with suggestions, temperature slider, maxTokens, and collapsible system prompt textarea; role cards show temperature badges
6. **Comprehensive tests** — Added tests for model config serialization, prompt loading, runtime resolution, and agent:start model config handling

All 1,260 tests passing (510 core + 750 CLI).
