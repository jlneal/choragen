# Scenario: Agent Runtime Orchestration

**Domain**: core  
**Created**: 2025-12-07  

---

## User Story

As a **project owner**, I want the CLI to spawn and orchestrate agent sessions directly, so that governance is enforced programmatically and agents cannot bypass role boundaries.

---

## Problem Statement

Currently, agent role enforcement relies on:
1. Agents self-declaring their role at session start
2. Humans manually copying handoff prompts between sessions
3. Agents voluntarily checking governance before file operations

This creates gaps:
- Agents can forget or ignore role declarations
- Handoffs lose context or introduce errors
- Governance checks are advisory, not enforced

More fundamentally: **the human remains the bottleneck**. Whether writing code, reviewing AI code, or copying prompts—the human's attention is the limiting factor.

---

## Desired State

The CLI becomes an **agent runtime** that:
1. Spawns agent sessions with explicit role assignment
2. Exposes only role-appropriate tools to each session
3. Enforces governance at tool execution time
4. Automatically spawns child sessions for handoffs
5. Captures metrics and audit trails automatically

---

## Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    $ choragen agent:start                   │
│                                                             │
│   1. User runs CLI command                                  │
│   2. CLI loads role-specific system prompt                  │
│   3. CLI calls LLM API with restricted tool set             │
│   4. LLM returns tool calls                                 │
│   5. CLI validates each tool call against governance        │
│   6. CLI executes allowed tools, rejects violations         │
│   7. If tool is "spawn_impl_session":                       │
│      a. CLI starts nested agentic loop                      │
│      b. Impl agent runs with impl-only tools                │
│      c. Impl agent completes, returns to control loop       │
│   8. Loop continues until agent signals completion          │
│   9. CLI records metrics, ends session                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Constraints

- **No IDE dependency** - Works in any terminal
- **No MCP** - Direct LLM API calls, not tool discovery
- **Governance is enforced** - Agents cannot bypass via prompt injection
- **Sessions are isolated** - Child sessions have separate context
- **Metrics are automatic** - No agent cooperation required

---

## Acceptance Criteria

- [ ] CLI can start a control agent session via `agent:start --role=control`
- [ ] CLI can start an impl agent session via `agent:start --role=impl`
- [ ] Control sessions can spawn impl sessions without human intervention
- [ ] Governance violations are rejected at tool execution time
- [ ] Session metrics (tokens, duration, tool calls) are recorded automatically
- [ ] Agent cannot access tools outside its role's allowed set

---

## Persona Value

### [AI Agent](../personas/ai-agent.md)

**Value**: Receives clear role boundaries enforced by runtime, not convention. Cannot accidentally violate governance. Gets automatic context injection for tasks.

### [Solo Developer](../personas/solo-developer.md)

**Value**: Can run `choragen agent:start` and let the system handle coordination. No manual prompt copying or session management.

### [Team Lead](../personas/team-lead.md)

**Value**: Gains confidence that governance is enforced, not suggested. Audit trail shows exactly what each agent session did.

### [Open Source Maintainer](../personas/open-source-maintainer.md)

**Value**: Can safely delegate to AI agents knowing they cannot exceed their role boundaries. Reduces review burden.

---

## Linked Use Cases

- [Start Agent Session](../use-cases/start-agent-session.md) (to be created)
- [Spawn Child Session](../use-cases/spawn-child-session.md) (to be created)
- [Enforce Governance at Runtime](../use-cases/enforce-governance-runtime.md) (to be created)

---

## Linked Features

- [Agent Runtime](../features/agent-runtime.md) (to be created)
- [Governance Enforcement](../features/governance-enforcement.md)
- [Task Chain Management](../features/task-chain-management.md)
