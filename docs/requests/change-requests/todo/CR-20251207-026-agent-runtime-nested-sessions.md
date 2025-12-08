# Change Request: Agent Runtime Nested Sessions

**ID**: CR-20251207-026  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-07  
**Owner**: control-agent  

---

## What

Enable control agent sessions to spawn implementation agent sessions directly, without human intervention. This completes the automated handoff capability.

This is **Phase 2** of the Agent Runtime feature.

---

## Why

Phase 1 (CR-20251207-025) establishes single-role sessions. But the core value proposition of Choragen is **automated coordination**:

1. Control agent analyzes backlog
2. Control agent creates chain and tasks
3. Control agent spawns impl agent for each task
4. Impl agent completes work, returns control
5. Control agent reviews and approves

Without nested sessions, step 3 still requires human intervention—defeating the purpose.

---

## Scope

**In Scope**:
- `spawn_impl_session` tool for control agents
- Session isolation (child sessions have separate context)
- Context passing (task ID, chain ID, relevant files)
- Child session completion detection
- Result propagation back to parent session
- Nested session metrics aggregation

**Out of Scope**:
- File read/write tools (Phase 3: CR-20251207-027)
- Parallel child sessions (future work)
- Cross-chain session spawning (future work)

---

## Affected Design Documents

- [Agent Runtime](../../design/core/features/agent-runtime.md)
- [Agent Runtime Orchestration](../../design/core/scenarios/agent-runtime-orchestration.md)

---

## Linked ADRs

- ADR-007: Agent Runtime Architecture

---

## Acceptance Criteria

- [ ] Control agent can call `spawn_impl_session` tool
- [ ] `spawn_impl_session` accepts task ID and chain ID
- [ ] Child session starts with impl role and task context
- [ ] Child session has isolated message history
- [ ] Child session inherits governance rules from parent
- [ ] Child session completion returns control to parent
- [ ] Parent session receives summary of child session actions
- [ ] Nested session metrics are recorded separately but linked
- [ ] Maximum nesting depth is enforced (default: 2)

---

## Commits

No commits yet.

---

## Implementation Notes

### spawn_impl_session Tool Definition

```typescript
const spawnImplSessionTool = {
  name: "spawn_impl_session",
  description: "Spawn an implementation agent session to work on a specific task",
  input_schema: {
    type: "object",
    properties: {
      chainId: {
        type: "string",
        description: "The chain ID containing the task"
      },
      taskId: {
        type: "string", 
        description: "The task ID to work on"
      },
      context: {
        type: "string",
        description: "Additional context to pass to the impl agent"
      }
    },
    required: ["chainId", "taskId"]
  }
};
```

### Session Hierarchy

```
Control Session (session-001)
├── Messages: [system, user, assistant, tool...]
├── Role: control
├── Children:
│   └── Impl Session (session-001-child-001)
│       ├── Messages: [system, user, assistant, tool...]
│       ├── Role: impl
│       ├── Parent: session-001
│       └── Task: TASK-001-foo
```

### Context Injection for Child Sessions

When spawning impl session, inject:
1. Task file contents (full markdown)
2. Relevant source files (from task's file list)
3. Governance rules for allowed file patterns
4. Parent session ID (for metrics linking)

---

## Completion Notes

[Added when moved to done/]
