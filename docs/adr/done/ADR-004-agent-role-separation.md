# ADR-004: Agent Role Separation

**Status**: Done  
**Created**: 2025-12-07  
**Linked CR**: CR-20251206-012  
**Linked Design Docs**: docs/design/core/features/agent-workflow.md

---

## Context

Agentic development workflows face several challenges:

1. **Context pollution** — A single agent accumulating context across planning, implementation, and review phases can lead to confusion and inconsistent decisions
2. **Self-approval risk** — An agent that implements code should not approve its own work
3. **Reproducibility** — Long-running agent sessions make it difficult to reproduce starting conditions
4. **Accountability** — Without clear role boundaries, it's unclear which agent made which decision

We need a model that separates concerns while maintaining traceability.

---

## Decision

Adopt a **two-agent model** with distinct roles:

### Control Agent

- Manages work lifecycle (CR → Chain → Task → Review)
- Creates and populates task files with acceptance criteria
- Reviews completed work from implementation agents
- Never implements code directly

### Implementation Agent

- Executes tasks from task files
- Works with fresh context per task
- Reports completion with verification results
- Never moves task files or approves own work

### Handoff Process

1. Control agent creates task file with acceptance criteria
2. Control agent generates standardized handoff prompt
3. Human spawns fresh implementation agent session
4. Implementation agent reads task file and executes
5. Implementation agent reports completion
6. Control agent reviews and approves/reworks

---

## Consequences

**Positive**:

- **Context boundaries** — Each agent has clear, bounded context
- **Review integrity** — Control agents review work they did not implement
- **Reproducibility** — Fresh agent sessions produce consistent starting points
- **Accountability** — Clear ownership of decisions and implementations

**Negative**:

- **Overhead** — Requires handoff between agents for each task
- **Human coordination** — Human must spawn new sessions and paste handoff prompts
- **Latency** — Additional round-trips between agents

**Mitigations**:

- Control-only tasks for trivial work (verification, closure, commits)
- Standardized handoff templates reduce friction
- Future MCP automation can reduce human coordination burden

---

## Alternatives Considered

### Alternative 1: Single Agent Model

Use one agent for all phases of work.

**Rejected because**: Self-approval of work undermines review integrity, and context accumulation leads to inconsistent behavior.

### Alternative 2: Three-Agent Model

Separate control, implementation, and review into three distinct roles.

**Rejected because**: Adds complexity without proportional benefit. Control agent reviewing implementation agent's work provides sufficient separation.

---

## Implementation

- `docs/agents/control-agent.md`
- `docs/agents/impl-agent.md`
- `docs/agents/handoff-templates.md`
