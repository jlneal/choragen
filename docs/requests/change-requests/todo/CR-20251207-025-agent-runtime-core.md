# Change Request: Agent Runtime Core

**ID**: CR-20251207-025  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-07  
**Owner**: control-agent  

---

## What

Implement the core agentic loop that allows the CLI to spawn and run agent sessions directly, with role-based tool filtering and governance enforcement.

This is **Phase 1** of the Agent Runtime feature—the minimal viable implementation that proves the architecture works.

---

## Why

Currently, agent governance is advisory:
- Agents self-declare roles (can be forgotten)
- Governance checks are voluntary (can be skipped)
- Handoffs require manual prompt copying (error-prone)

By making the CLI the agent runtime, we get:
- **Enforced role boundaries** - Agents only see allowed tools
- **Automatic governance** - Every tool call is validated
- **Audit trail** - CLI records all actions

This CR establishes the foundation for fully automated agent orchestration.

---

## Scope

**In Scope**:
- Agentic loop implementation in `@choragen/core`
- `agent:start` CLI command with `--role` flag
- Tool registry with role-based filtering
- Governance gate for tool call validation
- LLM client abstraction (Anthropic, OpenAI, Gemini)
- Basic console output showing agent actions
- Session metrics recording

**Out of Scope**:
- Nested sessions (Phase 2: CR-20251207-026)
- File read/write tools (Phase 3: CR-20251207-027)
- Error recovery, cost controls (Phase 4: CR-20251207-028)
- Interactive mode / menus

---

## Affected Design Documents

- [Agent Runtime](../../design/core/features/agent-runtime.md)
- [Agent Runtime Orchestration](../../design/core/scenarios/agent-runtime-orchestration.md)
- [Governance Enforcement](../../design/core/features/governance-enforcement.md)

---

## Linked ADRs

- ADR-007: Agent Runtime Architecture (to be created with this CR)

---

## Acceptance Criteria

- [ ] `choragen agent:start --role=control` starts a control agent session
- [ ] `choragen agent:start --role=impl` starts an impl agent session
- [ ] Control role sees only control-allowed tools (chain:*, task:approve, etc.)
- [ ] Impl role sees only impl-allowed tools (task:start, task:complete, etc.)
- [ ] Tool calls are validated against governance before execution
- [ ] Governance violations are rejected with clear error messages
- [ ] Session outputs tool calls and results to console
- [ ] Session metrics (tokens, duration) are recorded to `.choragen/metrics/`
- [ ] `--model` flag allows specifying LLM model
- [ ] `--dry-run` flag shows what would happen without executing

---

## Commits

No commits yet.

---

## Implementation Notes

### Minimal Tool Set for Phase 1

**Control Agent Tools**:
- `chain:new` - Create task chain
- `chain:status` - View chain status  
- `chain:list` - List all chains
- `task:add` - Add task to chain
- `task:approve` - Approve completed task
- `task:rework` - Send task back for rework
- `backlog:view` - View CR/FR backlog

**Impl Agent Tools**:
- `chain:status` - View chain status
- `task:start` - Start working on task
- `task:complete` - Mark task complete
- `task:status` - View task details

### Key Files to Create

```
packages/core/src/
├── runtime/
│   ├── index.ts           # Public exports
│   ├── agentic-loop.ts    # Core loop implementation
│   ├── tool-registry.ts   # Tool definitions and role filtering
│   ├── governance-gate.ts # Tool call validation
│   ├── prompt-loader.ts   # System prompt loading
│   └── llm-client.ts      # LLM API abstraction

packages/cli/src/commands/
└── agent.ts               # agent:start command
```

### Environment Variables

```bash
# Provider API Keys (at least one required)
ANTHROPIC_API_KEY=sk-ant-...    # For Claude models
OPENAI_API_KEY=sk-...           # For GPT models
GEMINI_API_KEY=...              # For Gemini models

# Defaults
CHORAGEN_PROVIDER=anthropic     # anthropic | openai | gemini
CHORAGEN_MODEL=claude-sonnet-4-20250514     # Provider-specific model name
CHORAGEN_MAX_TOKENS=4096        # Max output tokens per turn
```

### Supported Models (Initial)

| Provider | Models |
|----------|--------|
| Anthropic | claude-sonnet-4-20250514, claude-3-5-haiku |
| OpenAI | gpt-4o, gpt-4o-mini |
| Gemini | gemini-2.0-flash, gemini-1.5-pro |

---

## Completion Notes

[Added when moved to done/]
