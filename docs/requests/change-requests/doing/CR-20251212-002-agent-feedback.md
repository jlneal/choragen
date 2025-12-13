# Change Request: Agent Feedback

**ID**: CR-20251212-002  
**Domain**: core  
**Status**: doing  
**Created**: 2025-12-12  
**Owner**: agent  
**Chain**: CHAIN-070-agent-feedback  

---

## What

Implement a structured feedback mechanism for agents to communicate back to humans during workflow execution. This includes:

- **Feedback types**: clarification, question, idea, blocker, review
- **Feedback lifecycle**: pending → acknowledged → resolved/dismissed
- **Context support**: file references, code snippets, selectable options
- **Priority levels**: low, medium, high, critical
- **UI integration**: inline chat responses, feedback panel, dashboard aggregation

---

## Why

Currently, agents have limited ways to communicate with humans:

1. **All-or-nothing gates** — Human approval gates block all progress until satisfied
2. **No structured questions** — Agents can't formally request clarification
3. **Lost context** — Questions asked in chat may be lost across sessions
4. **No prioritization** — All feedback treated equally regardless of urgency

Structured feedback enables asynchronous human-agent collaboration without blocking entire workflows.

---

## Scope

**In Scope**:
- `FeedbackManager` for CRUD operations on feedback items
- `feedback:create` tool for agents
- Feedback persistence in workflow directory
- Chat interface rendering of feedback as interactive messages
- Human response UI (inline and panel)
- Blocker feedback preventing workflow advancement
- Dashboard aggregation of pending feedback

**Out of Scope**:
- Feedback expiration/auto-dismiss
- Batch responses to multiple feedback
- External notification system (email, Slack, etc.)

---

## Affected Design Documents

- docs/design/core/features/agent-feedback.md
- docs/design/core/features/web-chat-interface.md

---

## Linked ADRs

- ADR-011: Web API Architecture
- ADR-TBD: Agent Feedback Design

---

## Commits

No commits yet.

---

## Implementation Notes

Key implementation areas:
1. Create `FeedbackManager` in `@choragen/core`
2. Define `FeedbackItem` types and schemas
3. Add `feedback:create` tool to agent runtime
4. Create feedback persistence in `.choragen/workflows/*/feedback/`
5. Add tRPC router for feedback operations
6. Create chat UI component for feedback messages
7. Create feedback panel component
8. Add feedback badge to workflow sidebar

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
