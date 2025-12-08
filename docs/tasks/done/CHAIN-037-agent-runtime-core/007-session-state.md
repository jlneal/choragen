# Task: Session State Management

**Chain**: CHAIN-037-agent-runtime-core  
**Task**: 007-session-state  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-08

---

## Objective

Implement session state persistence to `.choragen/sessions/` for audit trail and potential resume.

---

## Context

Each agent session should be recorded:
- Session metadata (ID, role, start time, model)
- Conversation history (messages, tool calls)
- Token usage
- Outcome (success/failure)

This provides an audit trail and enables future session resume capability.

**Reference**: ADR-010 Section 5 (Session State as Files)

---

## Expected Files

Create:
- `packages/cli/src/runtime/session.ts` — Session state management

---

## Acceptance Criteria

- [ ] `Session` class that tracks session state
- [ ] Generates unique session ID (e.g., `session-20251208-143052-abc123`)
- [ ] Persists to `.choragen/sessions/{session-id}.json`
- [ ] Records: role, model, chainId, taskId, startTime, endTime
- [ ] Records: messages array (conversation history)
- [ ] Records: toolCalls array with timestamps and results
- [ ] Records: tokenUsage (input, output, total)
- [ ] Records: outcome (success, failure, interrupted)
- [ ] `save()` method writes current state to file
- [ ] `load(sessionId)` static method reads existing session
- [ ] Auto-saves after each tool call (for crash recovery)
- [ ] Unit tests for session persistence
- [ ] TypeScript compiles without errors

---

## Constraints

- Keep session files human-readable (pretty-printed JSON)
- Do NOT implement session resume logic yet (just persistence)
- Session files should be git-ignored (add to `.gitignore` if needed)

---

## Notes

**Session File Format**:
```json
{
  "id": "session-20251208-143052-abc123",
  "role": "control",
  "model": "claude-sonnet-4-20250514",
  "chainId": "CHAIN-037-agent-runtime-core",
  "taskId": null,
  "startTime": "2025-12-08T14:30:52.000Z",
  "endTime": "2025-12-08T14:35:12.000Z",
  "outcome": "success",
  "tokenUsage": {
    "input": 12450,
    "output": 3200,
    "total": 15650
  },
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "assistant", "content": "...", "toolCalls": [...] },
    { "role": "tool", "name": "chain:status", "content": "..." }
  ],
  "toolCalls": [
    {
      "timestamp": "2025-12-08T14:31:05.000Z",
      "name": "chain:status",
      "params": { "chainId": "CHAIN-037" },
      "result": { "success": true, "data": {...} },
      "governanceResult": { "allowed": true }
    }
  ]
}
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
