# ADR-010: Agent Runtime Architecture

**Status**: todo  
**Created**: 2025-12-08  
**Linked CR/FR**: CR-20251207-025, CR-20251207-026, CR-20251207-027, CR-20251207-028  
**Linked Design Docs**: docs/design/core/features/agent-runtime.md, docs/design/core/scenarios/agent-runtime-orchestration.md  

---

## Context

Choragen currently provides governance, task chains, and traceability as a framework that agents *should* follow. However, enforcement relies on convention—agents can violate boundaries if their host environment (Cursor, Windsurf, etc.) doesn't prevent it.

The Agent Runtime transforms Choragen from advisory governance into enforced governance by making the CLI the agent's runtime environment. The CLI:
1. Spawns agent sessions directly (calling LLM APIs)
2. Intercepts all tool calls before execution
3. Validates each tool call against governance rules
4. Executes allowed tools, rejects violations
5. Manages nested sessions (control spawning impl)

This requires architectural decisions about:
- How to structure the agentic loop
- How to define and filter tools by role
- How to manage session state
- How to abstract across LLM providers
- How to handle errors and recovery

---

## Decision

### 1. CLI as Runtime, Not Wrapper

The CLI will directly implement the agentic loop rather than wrapping external tools. This means:
- CLI calls LLM APIs directly (Anthropic, OpenAI, Gemini)
- CLI defines the tool schema and executes tools
- CLI manages conversation history and session state

**Rationale**: Wrapping external tools (e.g., spawning Cursor) would not allow tool-call interception. Direct API access is required for governance enforcement.

### 2. Role-Gated Tool Sets

Each agent role receives a filtered tool set:

**Control Agent Tools**:
- `read_file` — Read any file
- `list_directory` — List directory contents
- `search_files` — Search codebase
- `spawn_impl_session` — Start nested impl agent
- `create_task` — Add tasks to chains
- `transition_task` — Move tasks through workflow
- `approve_task` — Approve completed work
- `request_rework` — Send task back for changes
- `complete_chain` — Mark chain as done

**Impl Agent Tools**:
- `read_file` — Read any file
- `write_file` — Write files (governance-checked)
- `list_directory` — List directory contents
- `search_files` — Search codebase
- `run_command` — Execute shell commands (allowlisted)
- `complete_task` — Signal task completion

**Rationale**: Role separation is enforced at the tool level. Control agents cannot write files; impl agents cannot approve tasks. This is the core governance mechanism.

### 3. Governance Validation at Execution

Every tool call passes through a validation layer before execution:

```
LLM Response → Parse Tool Call → Validate Against Governance → Execute or Reject
```

Validation checks:
- Is this tool allowed for the current role?
- Does the file path match governance rules?
- Is the action (create/modify/delete) permitted?
- Are any file locks held by other chains?

Rejected tool calls return an error message to the agent, allowing it to adjust.

### 4. Provider Abstraction Layer

A thin abstraction normalizes differences between LLM providers:

```typescript
interface LLMProvider {
  chat(messages: Message[], tools: Tool[]): AsyncIterable<StreamChunk>;
  parseToolCalls(response: Response): ToolCall[];
}
```

Implementations:
- `AnthropicProvider` — Claude models
- `OpenAIProvider` — GPT models  
- `GeminiProvider` — Gemini models

Provider selection via environment variable or config:
```bash
CHORAGEN_LLM_PROVIDER=anthropic
CHORAGEN_LLM_MODEL=claude-sonnet-4-20250514
ANTHROPIC_API_KEY=sk-...
```

**Rationale**: Multi-provider support from day one allows cost/performance tuning and avoids vendor lock-in.

### 5. Session State as Files

Session state is persisted to `.choragen/sessions/`:
- `{session-id}.json` — Conversation history, current task, role
- Enables resume after interruption
- Provides audit trail

**Rationale**: Files are the source of truth (consistent with Choragen philosophy). No database required.

### 6. Nested Sessions via Tool Call

Control agents spawn impl agents via the `spawn_impl_session` tool:

```typescript
{
  name: "spawn_impl_session",
  parameters: {
    chain_id: "CHAIN-001-feature",
    task_id: "001-implement-parser"
  }
}
```

The CLI:
1. Pauses the control session
2. Starts a new impl session with task context
3. Runs impl to completion (or error)
4. Returns result to control session
5. Resumes control loop

**Rationale**: This enables fully autonomous operation—control agent orchestrates without human intervention.

### 7. Streaming Output

Agent responses stream to the terminal in real-time:
- Tool calls shown as they're made
- File writes shown with diffs
- Errors highlighted immediately

**Rationale**: Human monitoring requires visibility. Streaming provides real-time awareness without blocking.

---

## Consequences

**Positive**:
- Governance is enforced, not suggested—agents cannot violate role boundaries
- Multi-provider support enables cost optimization and redundancy
- Session persistence enables resume and audit
- Nested sessions enable fully autonomous operation
- File-based state is simple and inspectable

**Negative**:
- Direct API calls mean managing rate limits, retries, and errors
- Tool schema must be maintained in sync with governance rules
- Session files could accumulate and need cleanup

**Mitigations**:
- Implement exponential backoff and retry logic in provider layer
- Generate tool schemas from governance config where possible
- Add session cleanup command (`choragen session:prune`)

---

## Alternatives Considered

### Alternative 1: Wrap Existing Tools (Cursor, Aider, etc.)

Spawn Cursor or Aider as subprocesses and parse their output.

**Rejected because**: Cannot intercept tool calls before execution. Governance would be advisory only, defeating the purpose.

### Alternative 2: MCP Server Architecture

Implement as an MCP server that other tools connect to.

**Rejected because**: MCP is for tool *provision*, not tool *interception*. We need to control the agentic loop, not just provide tools to it.

### Alternative 3: Single Provider (Anthropic Only)

Start with Anthropic only, add others later.

**Rejected because**: Multi-provider is low incremental cost at design time but high cost to retrofit. Provider abstraction from day one is worth the small upfront investment.

### Alternative 4: Database for Session State

Use SQLite or similar for session persistence.

**Rejected because**: Adds dependency, complexity, and opacity. JSON files are human-readable, git-friendly, and sufficient for the use case.

---

## Implementation

[Added when moved to done/]

- `packages/cli/src/runtime/` — Agent runtime implementation
- `packages/cli/src/runtime/providers/` — LLM provider implementations
- `packages/cli/src/runtime/tools/` — Tool definitions and executors
- `packages/cli/src/runtime/session.ts` — Session state management
- `packages/core/src/governance/tool-filter.ts` — Role-based tool filtering
