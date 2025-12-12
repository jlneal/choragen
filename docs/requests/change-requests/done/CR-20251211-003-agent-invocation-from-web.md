# Change Request: Agent Invocation from Web

**ID**: CR-20251211-003  
**Domain**: web  
**Status**: done  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Enable the chat interface to invoke agent sessions and stream responses in real-time. When a user sends a message or approves a gate, the system spawns an agent session for the current workflow stage and streams the agent's responses back to the chat UI.

---

## Why

The chat interface currently has:
- Workflow display and navigation ✓
- Gate approval UI ✓
- Message history ✓
- Send message input (disabled, "Coming Soon")

But it cannot actually run agents because:
1. No mechanism to spawn an agent session from the web server
2. No streaming of agent responses to the client
3. The chat input is not wired to trigger agent work

Without this, the workflow system is view-only. Users can see workflows but cannot drive them forward through the chat.

---

## Scope

**In Scope**:
- Wire chat input to send human messages and trigger agent responses
- `workflow.invokeAgent` tRPC mutation that spawns an agent session
- Agent session runs in the context of the current workflow stage
- Stream agent messages to client via SSE or WebSocket
- Display agent responses in real-time (typing indicator → message)
- Handle agent completion (advance workflow if gate satisfied)
- Error handling for agent failures (display error, allow retry)
- Gate approval triggers agent for next stage

**Out of Scope**:
- Parallel agent sessions
- Agent cancellation mid-response (future enhancement)
- Voice input/output

---

## Acceptance Criteria

- [x] Chat input is enabled and functional
- [x] Sending a message adds it to workflow history
- [x] After human message, agent session is spawned for current stage
- [x] Agent responses stream to UI in real-time
- [x] Typing indicator shows while agent is processing
- [x] Agent tool calls are displayed (collapsible)
- [x] Agent completion updates workflow state
- [x] Gate approval triggers agent for next stage
- [x] Errors display with retry option
- [x] Works with configured API keys from CR-20251211-001

---

## Affected Design Documents

- [Web Chat Interface](../../../design/core/features/web-chat-interface.md)
- [Workflow Orchestration](../../../design/core/features/workflow-orchestration.md)
- [Agent Runtime](../../../design/core/features/agent-runtime.md)

---

## Linked ADRs

- ADR-010: Agent Runtime Architecture
- ADR-011: Web API Architecture

---

## Dependencies

- **CR-20251211-001**: API Key Settings (needs configured provider to invoke agents)

---

## Commits

- feat(web): agent invocation from chat interface [CR-20251211-003]

---

## Implementation Notes

Key files to create/modify:
- `packages/web/src/components/chat/chat-input.tsx` — Enable input, wire to mutation
- `packages/web/src/server/routers/workflow.ts` — Add `invokeAgent` mutation
- `packages/web/src/lib/agent-stream.ts` — SSE/WebSocket client for streaming
- `packages/cli/src/runtime/` — Expose agent session runner for web consumption

Architecture options for agent invocation:

**Option A: In-process**
- Web server spawns agent session directly
- Simpler, but blocks the Node process during agent work
- May cause timeouts for long-running sessions

**Option B: Subprocess**
- Web server spawns CLI subprocess (`choragen agent:run`)
- Streams stdout back to client
- More isolated, handles long-running work better

**Option C: Background worker**
- Separate worker process for agent sessions
- Web server communicates via IPC or Redis
- Most scalable, but more complex

Recommendation: Start with Option B (subprocess) for isolation and simplicity. The CLI already has the agent runtime; we just need to invoke it and stream output.

Streaming approach:
- Use Server-Sent Events (SSE) for simplicity
- Each agent message/tool call is an event
- Client accumulates events into message list
- Fallback to polling if SSE not supported

---

## Completion Notes

Implemented via CHAIN-066-agent-invocation-web (10 tasks).

**Key deliverables:**
- New `agent:run` CLI command for workflow-bound streaming sessions
- `invokeAgent` tRPC mutation with workflow validation
- SSE endpoint at `/api/agent-stream` for real-time streaming
- `subscribeToAgentStream` client helper
- Enhanced `ChatContainer` with auto-agent invocation after human messages
- `TypingIndicator` with role-based labeling (impl/control)
- `ToolCallDisplay` with collapsible args/results and status badges
- `AgentErrorMessage` with retry and settings link for API key issues
- `GatePrompt` chaining approval → agent invocation

**Architecture:** Option B (subprocess) as recommended - web server spawns CLI subprocess and streams stdout via SSE.

**Files created/modified:**
- `packages/cli/src/commands/agent-run.ts` (new)
- `packages/cli/src/runtime/loop.ts` (AgentSessionEvents support)
- `packages/web/src/app/api/agent-stream/route.ts` (new)
- `packages/web/src/lib/agent-subprocess.ts` (new)
- `packages/web/src/lib/agent-stream.ts` (new)
- `packages/web/src/components/chat/chat-container.tsx`
- `packages/web/src/components/chat/typing-indicator.tsx`
- `packages/web/src/components/chat/tool-call-display.tsx`
- `packages/web/src/components/chat/error-message.tsx`
- `packages/web/src/components/chat/gate-prompt.tsx`
- `packages/web/src/server/routers/workflow.ts`
- Tests updated throughout
