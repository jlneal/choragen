# Change Request: Agent Runtime Production Hardening

**ID**: CR-20251207-028  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-07  
**Owner**: control-agent  

---

## What

Add production-readiness features to the agent runtime: error recovery, cost controls, human-in-the-loop checkpoints, and multi-provider support.

This is **Phase 4** of the Agent Runtime feature.

---

## Why

Phases 1-3 establish a working agent runtime, but it's not production-ready:

- **No error recovery** - If an agent fails mid-task, work is lost
- **No cost controls** - Runaway sessions can burn through API credits
- **No human checkpoints** - Some actions should require approval
- **Single provider** - Locked to Anthropic API

Phase 4 addresses these gaps to make the runtime suitable for real-world use.

---

## Scope

**In Scope**:
- Error recovery and session resumption
- Token/cost limits per session
- Human-in-the-loop approval for sensitive actions
- Local model support (Ollama)
- Session persistence (resume after crash)
- Graceful shutdown handling

**Out of Scope**:
- Web UI (future feature)
- Multi-user support (future feature)
- Cloud deployment (future feature)

---

## Affected Design Documents

- [Agent Runtime](../../design/core/features/agent-runtime.md)

---

## Linked ADRs

- ADR-007: Agent Runtime Architecture

---

## Acceptance Criteria

### Error Recovery
- [ ] Failed tool calls are retried with exponential backoff
- [ ] Session state is persisted after each turn
- [ ] `agent:resume` command continues a crashed session
- [ ] Unrecoverable errors trigger graceful shutdown with state dump

### Cost Controls
- [ ] `--max-tokens` flag limits total tokens per session
- [ ] `--max-cost` flag limits estimated cost per session
- [ ] Warning at 80% of limit, hard stop at 100%
- [ ] Cost tracking displayed in session output
- [ ] Session summary shows total cost

### Human Checkpoints
- [ ] `--require-approval` flag enables checkpoint mode
- [ ] Sensitive actions (file delete, chain close) pause for approval
- [ ] Approval prompt shows action details and waits for y/n
- [ ] Timeout on approval prompt (default: 5 minutes)
- [ ] `--auto-approve` flag for CI/CD (skips prompts)

### Local Model Support
- [ ] `--provider=ollama` flag for local models
- [ ] Ollama-specific configuration via environment variables
- [ ] Graceful degradation for models without tool support

### Session Persistence
- [ ] Session state saved to `.choragen/sessions/{session-id}.json`
- [ ] State includes: messages, tool calls, metrics, position
- [ ] `agent:list-sessions` shows saved sessions
- [ ] `agent:resume {session-id}` continues session
- [ ] `agent:cleanup` removes old session files

---

## Commits

No commits yet.

---

## Implementation Notes

### Session State Schema

```typescript
interface PersistedSession {
  id: string;
  role: AgentRole;
  provider: string;
  model: string;
  started: string;
  lastUpdated: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  
  // Context
  taskId?: string;
  chainId?: string;
  parentSessionId?: string;
  
  // State
  messages: Message[];
  toolCallHistory: ToolCallRecord[];
  
  // Metrics
  tokensUsed: { input: number; output: number };
  estimatedCost: number;
  turnCount: number;
  
  // Limits
  maxTokens?: number;
  maxCost?: number;
  
  // Error info (if failed)
  error?: {
    message: string;
    stack?: string;
    recoverable: boolean;
  };
}
```

### Human Checkpoint Flow

```
Tool call received: delete_file("packages/core/src/important.ts")
    │
    ▼
Is action sensitive? (delete, chain:close, etc.)
    │ No → Execute normally
    │
    ▼ Yes
Is --require-approval enabled?
    │ No → Execute normally
    │
    ▼ Yes
Display approval prompt:
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  APPROVAL REQUIRED                                      │
│                                                             │
│  Action: delete_file                                        │
│  Path: packages/core/src/important.ts                       │
│  Session: session-20251207-214532                           │
│                                                             │
│  Approve? [y/N] (timeout: 5m)                               │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
User response
    │ y → Execute, continue
    │ n → Reject, inform agent
    │ timeout → Reject, pause session
```

### Ollama Provider

```typescript
class OllamaProvider implements LLMProvider {
  // Local models - no API key needed
  // May not support tool calling - use prompt-based fallback
}
```

### Environment Variables (Ollama)

```bash
# Ollama (local)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama2

# Cost controls
CHORAGEN_MAX_TOKENS=100000
CHORAGEN_MAX_COST=5.00
```

**Note**: Anthropic, OpenAI, and Gemini providers are implemented in Phase 1 (CR-20251207-025).

---

## Completion Notes

[Added when moved to done/]
