# Change Request: Web-Runtime Bridge

**ID**: CR-20251210-005  
**Domain**: web  
**Status**: done  
**Created**: 2025-12-10  
**Owner**: agent  

---

## What

Connect the web app to the workflow/session runtime so workflows can be started, monitored, and controlled from the web dashboard. This bridges the gap between the CLI-based runtime and the web UI.

---

## Why

Currently the agent runtime is CLI-only (`choragen agent:start`). To enable the human-driven development scenario where humans interact via a web chat interface, the web app needs to:

1. Start workflows and sessions
2. Send messages to active sessions
3. Receive real-time responses from agents
4. Satisfy gates (approve/reject) from the UI

This CR creates the API layer that makes the runtime accessible from the web.

---

## Scope

**In Scope**:
- tRPC router for workflow management (`workflowRouter`)
- `workflow.create` — Start a new workflow from a request ID or intent
- `workflow.get` — Get workflow state by ID
- `workflow.list` — List workflows (active, paused, completed)
- `workflow.sendMessage` — Send human message to active workflow
- `workflow.satisfyGate` — Approve or reject a stage gate
- `workflow.getHistory` — Get conversation history for a workflow
- `workflow.onMessage` — tRPC subscription for real-time message streaming
- Session state accessible from web (read current session, tool calls, etc.)
- Integration with `WorkflowManager` from CR-20251210-004

**Out of Scope**:
- Chat UI components (CR-20251210-006)
- Workflow templates management UI
- Session debugging/inspection tools

---

## Acceptance Criteria

- [x] `workflowRouter` added to tRPC app router
- [x] `workflow.create` mutation starts workflow and returns workflow ID
- [x] `workflow.get` query returns full workflow state including stages and messages
- [x] `workflow.list` query returns workflows filtered by status
- [x] `workflow.sendMessage` mutation sends message to active session
- [x] `workflow.satisfyGate` mutation marks gate as satisfied (approved/rejected)
- [x] `workflow.getHistory` query returns paginated message history
- [x] `workflow.onMessage` subscription streams new messages in real-time
- [x] Messages from agent sessions are captured and stored in workflow
- [x] Gate prompts are emitted as special message types
- [x] Error states are properly surfaced to the client

---

## Affected Design Documents

- [Web Chat Interface](../../../design/core/features/web-chat-interface.md)
- [Workflow Orchestration](../../../design/core/features/workflow-orchestration.md)

---

## Linked ADRs

- ADR-011: Web API Architecture

---

## Dependencies

- **CR-20251210-004**: Workflow Orchestration Core (needs `WorkflowManager`)

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create/modify:
- `packages/web/src/server/routers/workflow.ts` — New tRPC router
- `packages/web/src/server/routers/index.ts` — Add workflow router to app
- Integration point with `@choragen/core` workflow module

For real-time streaming, consider:
- tRPC subscriptions with `observable()` 
- Or SSE endpoint if subscriptions prove complex

The runtime currently runs in-process with the CLI. For web, we may need:
- Run runtime in same Next.js process (simpler, single-project use case)
- Or separate daemon process with IPC (more complex, multi-project)

Start with in-process for simplicity.

---

## Completion Notes

Implemented via CHAIN-060-web-runtime-bridge with 4 tasks:

1. **001-workflow-router-scaffold**: Created `workflowRouter` with full CRUD operations (create, get, list, sendMessage, satisfyGate, getHistory, updateStatus). Integrated with `WorkflowManager` from `@choragen/core`. 13 unit tests.

2. **002-realtime-subscription**: Added `workflow.onMessage` tRPC subscription using async generators with poll-based updates, immediate backlog emit, and cancellable delay cleanup. 3 subscription tests.

3. **003-agent-message-capture**: Extended `WorkflowMessageMetadata` type to support agent output (toolCalls, streaming, sessionId). Updated `WorkflowManager.addMessage()` and agent runtime (`loop.ts`) to capture rich metadata. Router `sendMessage` passes metadata through.

4. **004-gate-prompt-messages**: `WorkflowManager` now emits `gate_prompt` messages when human_approval stages become active (on create and advance). Messages include `{ type: "gate_prompt", gateType, prompt }` metadata for UI rendering.

All tests pass (453 core, 221 web). Typecheck clean.
