# Change Request: Specialized Agent Roles

**ID**: CR-20251212-001  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-12  
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
- ADR-TBD: Specialized Agent Roles

---

## Commits

No commits yet.

---

## Implementation Notes

Key implementation areas:
1. Extend `Role` interface in `@choragen/core` to include `model` and `systemPrompt`
2. Update `roles/index.yaml` schema to support new fields
3. Update agent runtime to resolve model config from role
4. Create default role definitions for all eight roles
5. Update web UI role editor to display/edit model config

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
