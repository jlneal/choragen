# Change Request: MCP Server for Agent Orchestration

**ID**: CR-20251206-003  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-06  
**Owner**: Justin  

---

## What

Create an MCP (Model Context Protocol) server that enables control agents to orchestrate implementation agent sessions programmatically.

---

## Why

Currently, the control agent → impl agent handoff requires human intervention:
1. Control agent creates task and outputs prompt
2. Human copies prompt to new session
3. Impl agent completes work
4. Human reports completion back to control agent

An MCP server would automate this:
1. Control agent calls `task:delegate` tool
2. MCP server spawns impl agent session with task context
3. Impl agent calls `task:signal-complete` when done
4. Control agent receives notification and reviews

---

## Scope

**In Scope**:
- MCP server package (`@choragen/mcp-server`)
- Tools for task delegation and signaling
- Integration with choragen CLI
- Documentation

**Out of Scope** (for now):
- Automatic agent session spawning (requires IDE integration)
- Remote/distributed agent coordination
- Authentication/authorization

---

## Open Design Questions

These need discussion before implementation:

1. **Transport**: stdio (local) or HTTP (remote)?
2. **Session spawning**: How to start impl agent sessions?
   - Windsurf API (if available)
   - VS Code extension
   - Manual with prepared context
3. **Notification mechanism**: How does impl agent notify control agent?
   - Polling
   - WebSocket
   - File-based signaling
4. **State management**: Where does shared state live?
   - Lock files (current)
   - SQLite
   - In-memory

---

## Proposed Tools

```typescript
// Control agent tools
"task:delegate" - Prepare task for impl agent
"task:await-completion" - Wait for impl agent signal
"task:review" - Review completed work

// Impl agent tools  
"task:get-context" - Get current task details
"task:signal-complete" - Signal work is done
"task:request-help" - Escalate to control agent

// Shared tools
"chain:status" - Get chain progress
"lock:status" - Get lock status
```

---

## Acceptance Criteria

- [ ] MCP server package created
- [ ] Core tools implemented
- [ ] Integration with existing CLI
- [ ] Documentation for setup and usage
- [ ] Example workflow demonstrated

---

## Linked ADRs

- (ADR to be created during implementation)

---

## Implementation Notes

Start with file-based signaling and manual session spawning.
Iterate toward more automation as IDE integration becomes available.

---

## Completion Notes

[To be added when moved to done/]
