# Feature: Agent Runtime

**Domain**: core  
**Status**: draft  
**Created**: 2025-12-07  

---

## Overview

The Agent Runtime transforms Choragen from a governance framework that agents *should* follow into an agent orchestrator that *enforces* governance. It provides a CLI-based agentic loop that spawns LLM sessions, restricts tools by role, and validates every action before execution.

---

## Problem

Current agent governance relies on:
- **Honor system** - Agents self-declare roles
- **Manual handoffs** - Humans copy prompts between sessions
- **Advisory checks** - Governance is suggested, not enforced

This creates failure modes:
- Role blurring when agents forget declarations
- Context loss during handoffs
- Governance bypass via prompt manipulation

---

## Solution

An **agentic loop** architecture where:

1. **CLI is the runtime** - Agents execute within CLI-controlled loops
2. **Tools are role-gated** - Each role sees only its allowed tools
3. **Governance is enforced** - Every tool call is validated before execution
4. **Handoffs are automatic** - Control agents spawn impl sessions directly

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Agent Runtime                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Prompt    │    │    Tool     │    │ Governance  │     │
│  │   Loader    │    │  Registry   │    │   Gate      │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                  │             │
│         ▼                  ▼                  ▼             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Agentic Loop                       │   │
│  │                                                      │   │
│  │   while (!done) {                                    │   │
│  │     response = llm.chat(messages, tools)             │   │
│  │     for (toolCall of response.toolCalls) {           │   │
│  │       if (!governanceGate.allows(toolCall, role)) {  │   │
│  │         reject(toolCall)                             │   │
│  │       } else {                                       │   │
│  │         result = execute(toolCall)                   │   │
│  │         if (toolCall.name === 'spawn_session') {     │   │
│  │           runChildSession(toolCall.input)            │   │
│  │         }                                            │   │
│  │       }                                              │   │
│  │     }                                                │   │
│  │   }                                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Metrics   │    │   Session   │    │    LLM      │     │
│  │  Collector  │    │    State    │    │   Client    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Components

### Prompt Loader

Loads role-specific system prompts from:
- `docs/agents/control-agent.md` → Control agent system prompt
- `docs/agents/impl-agent.md` → Implementation agent system prompt

Injects dynamic context:
- Current project state (chains, tasks, backlog)
- Session metadata (role, task assignment)
- Governance rules summary

### Tool Registry

Defines tools available to each role:

| Tool | Control | Impl | Description |
|------|---------|------|-------------|
| `chain:new` | ✓ | ✗ | Create task chain |
| `chain:status` | ✓ | ✓ | View chain status |
| `task:add` | ✓ | ✗ | Add task to chain |
| `task:start` | ✗ | ✓ | Start working on task |
| `task:complete` | ✗ | ✓ | Mark task complete |
| `task:approve` | ✓ | ✗ | Approve completed task |
| `task:rework` | ✓ | ✗ | Send task back |
| `spawn_impl_session` | ✓ | ✗ | Start impl agent |
| `read_file` | ✓ | ✓ | Read file contents |
| `write_file` | ✗ | ✓ | Write file (governed) |
| `governance:check` | ✓ | ✓ | Check file permission |

### Governance Gate

Validates every tool call before execution:

```typescript
interface GovernanceGate {
  allows(toolCall: ToolCall, role: AgentRole): boolean;
  getViolation(toolCall: ToolCall, role: AgentRole): string | null;
}
```

For file operations, checks:
- Role has permission for action (create/modify/delete)
- File matches allowed patterns for role
- No lock conflicts with other chains

### Agentic Loop

Core execution loop:

```typescript
async function runAgentSession(role: AgentRole, context: SessionContext) {
  const tools = toolRegistry.getToolsForRole(role);
  const systemPrompt = promptLoader.load(role, context);
  const messages = [{ role: 'system', content: systemPrompt }];
  
  while (true) {
    const response = await llmClient.chat({ messages, tools });
    
    for (const toolCall of response.toolCalls) {
      const violation = governanceGate.getViolation(toolCall, role);
      if (violation) {
        messages.push({ 
          role: 'tool', 
          content: `DENIED: ${violation}` 
        });
        continue;
      }
      
      const result = await executeToolCall(toolCall);
      messages.push({ role: 'tool', content: result });
      
      // Handle nested sessions
      if (toolCall.name === 'spawn_impl_session') {
        await runAgentSession('impl', toolCall.input);
      }
    }
    
    if (response.stopReason === 'end_turn') break;
  }
  
  metricsCollector.recordSession(role, messages);
}
```

### Session State

Tracks:
- Current role
- Assigned task (if any)
- Parent session (for nested sessions)
- Tool call history
- Token usage

### LLM Client

Abstraction over LLM providers (all supported from Phase 1):

| Provider | Models | Notes |
|----------|--------|-------|
| **Anthropic** | claude-sonnet-4-20250514, claude-3-5-haiku | Native tool support |
| **OpenAI** | gpt-4o, gpt-4o-mini | Native tool support |
| **Gemini** | gemini-2.0-flash, gemini-1.5-pro | Native tool support |
| **Ollama** | llama2, etc. | Phase 4, prompt-based fallback |

---

## CLI Interface

### Start Session

```bash
# Start control agent session
$ choragen agent:start --role=control

# Start impl agent session for specific task
$ choragen agent:start --role=impl --task=TASK-001-foo --chain=CHAIN-042

# Start with specific model
$ choragen agent:start --role=control --model=claude-sonnet-4-20250514

# Dry run (show what would happen, don't execute)
$ choragen agent:start --role=control --dry-run
```

### Session Output

```
╔═══════════════════════════════════════════════════════════════╗
║  CHORAGEN AGENT RUNTIME                                       ║
║  Role: control | Model: claude-sonnet-4-20250514                      ║
║  Session: session-20251207-214532                             ║
╠═══════════════════════════════════════════════════════════════╣

[Agent] Checking backlog...
> tool: chain:list
> result: 2 active chains, 3 CRs in backlog

[Agent] I see CR-20251207-025 needs a chain. Creating...
> tool: chain:new CR-20251207-025 feature-x "Feature X"
> result: Created CHAIN-050-feature-x

[Agent] Adding implementation task...
> tool: task:add CHAIN-050 implement-core "Implement core logic"
> result: Created TASK-001-implement-core

[Agent] Spawning implementation agent for this task...
> tool: spawn_impl_session {"task": "TASK-001-implement-core", "chain": "CHAIN-050"}

  ┌─────────────────────────────────────────────────────────┐
  │  NESTED SESSION: impl                                   │
  │  Task: TASK-001-implement-core                          │
  ├─────────────────────────────────────────────────────────┤
  │  [Impl Agent] Reading task file...                      │
  │  > tool: read_file docs/tasks/todo/CHAIN-050/TASK-001.. │
  │                                                         │
  │  [Impl Agent] Implementing feature...                   │
  │  > tool: write_file packages/core/src/feature-x.ts      │
  │  > governance: ✓ impl can modify packages/core/src/**   │
  │                                                         │
  │  [Impl Agent] Task complete.                            │
  │  > tool: task:complete CHAIN-050 TASK-001-implement-core│
  └─────────────────────────────────────────────────────────┘

[Agent] Implementation complete. Reviewing...
> tool: task:approve CHAIN-050 TASK-001-implement-core
> result: Task approved, moved to done

Session complete. Tokens: 12,450 input / 3,200 output
```

---

## Phased Implementation

### Phase 1: Minimal Agentic Loop

**CR**: [CR-20251207-025](../../../requests/change-requests/todo/CR-20251207-025-agent-runtime-core.md)

- Single-role sessions (no nesting)
- Basic tool set (chain/task commands)
- Governance validation
- Console output

**Deliverable**: `choragen agent:start --role=control` works end-to-end

### Phase 2: Nested Sessions

**CR**: [CR-20251207-026](../../../requests/change-requests/todo/CR-20251207-026-agent-runtime-nested-sessions.md)

- Control can spawn impl sessions
- Session isolation
- Context passing between sessions

**Deliverable**: Control agent can spawn impl agent without human intervention

### Phase 3: File Operations

**CR**: [CR-20251207-027](../../../requests/change-requests/todo/CR-20251207-027-agent-runtime-file-operations.md)

- Read/write file tools
- Governance enforcement for file mutations
- Lock integration

**Deliverable**: Impl agent can read and write files with governance enforcement

### Phase 4: Production Hardening

**CR**: [CR-20251207-028](../../../requests/change-requests/todo/CR-20251207-028-agent-runtime-production.md)

- Error recovery
- Cost controls (token limits)
- Human-in-the-loop checkpoints
- Multiple LLM provider support

**Deliverable**: Runtime is production-ready with safety controls

---

## Acceptance Criteria

- [ ] `choragen agent:start --role=control` starts a control session
- [ ] `choragen agent:start --role=impl` starts an impl session
- [ ] Tools are filtered by role before being sent to LLM
- [ ] Governance violations are rejected with clear error messages
- [ ] Control sessions can spawn impl sessions
- [ ] Nested sessions have isolated context
- [ ] Session metrics are recorded automatically
- [ ] File operations are validated against governance rules

---

## Linked Scenarios

- [Agent Runtime Orchestration](../scenarios/agent-runtime-orchestration.md)
- [Control Agent Workflow](../scenarios/control-agent-workflow.md)
- [Implementation Agent Workflow](../scenarios/implementation-agent-workflow.md)

---

## Linked ADRs

- ADR-010: Agent Runtime Architecture

---

## Open Questions

1. **Token limits** - How do we handle sessions that exceed context limits?
2. **Error recovery** - What happens if an impl session fails mid-task?
3. **Human checkpoints** - When should we pause for human approval?
4. **Cost controls** - How do we prevent runaway token usage?
5. **Model selection** - Should different roles use different models?
