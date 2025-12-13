# Change Request: Hook System Design

**ID**: CR-20251212-007  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-12  
**Owner**: agent  
**Chain**: CHAIN-067-hook-system-design

---

## What

Design and implement a comprehensive hook system for workflow stage and task transitions. Hooks enable deterministic, automated actions that don't rely on agent behavior.

### Hook Action Types

| Type | Purpose | Example |
|------|---------|---------|
| `command` | Run shell command | `pnpm build` |
| `file_move` | Move file between directories | Task to `in-review/` |
| `task_transition` | Update task status | Mark task as `in-progress` |
| `spawn_agent` | Spawn agent with role | Spawn Review agent |
| `post_message` | Post message to session | Notify orchestrator |
| `emit_event` | Emit event for listeners | `task:completed` |
| `custom` | Call registered handler | Custom validation |

### Hook Contexts

Hooks can be attached to:
- **Workflow stages**: `onEnter`, `onExit`
- **Tasks**: `onStart`, `onSubmit`, `onApprove`, `onReject`
- **Chains**: `onStart`, `onComplete`, `onApprove`, `onReject`

### Hook Definition

```yaml
hooks:
  - trigger: task:submit
    actions:
      - type: file_move
        from: "docs/tasks/in-progress/{{taskId}}.md"
        to: "docs/tasks/in-review/{{taskId}}.md"
      - type: spawn_agent
        role: review
        context:
          taskId: "{{taskId}}"
          chainId: "{{chainId}}"
      - type: post_message
        target: orchestrator
        content: "Task {{taskId}} submitted for review"
```

---

## Why

The vision emphasizes: *"Use hooks and scripts to execute as much of this as possible in order to enforce reliability and consistency."*

Current state:
- Hooks exist but are limited (`command`, `task_transition`, `file_move`, `custom`)
- No `spawn_agent` action — agents must be spawned manually or via tools
- No `post_message` action — no way for hooks to notify sessions
- No `emit_event` action — no event-driven orchestration

Hooks are the deterministic scaffolding that makes the assembly line work.

---

## Scope

**In Scope**:
- Add `spawn_agent` hook action type
- Add `post_message` hook action type
- Add `emit_event` hook action type
- Task-level hooks (`onStart`, `onSubmit`, `onApprove`, `onReject`)
- Chain-level hooks (`onStart`, `onComplete`, `onApprove`, `onReject`)
- Template variable interpolation in hook definitions
- Hook execution logging

**Out of Scope**:
- Conditional hooks (if/then logic)
- Hook chaining (output of one → input of another)
- Async hook execution with callbacks

---

## Affected Design Documents

- docs/design/core/features/standard-workflow.md
- docs/design/core/features/workflow-orchestration.md

---

## Linked ADRs

- ADR-012: Event-Driven Orchestration

---

## Commits

No commits yet.

---

## Implementation Notes

Key implementation areas:

1. **Extend `TransitionHookRunner`** — Add new action types
2. **`spawn_agent` action**:
   - Creates agent session with specified role
   - Injects context (taskId, chainId, etc.)
   - Returns session ID for tracking
3. **`post_message` action**:
   - Posts message to specified session
   - Supports `orchestrator`, `control`, or specific session ID
   - Message appears in session's conversation history
4. **`emit_event` action**:
   - Emits named event with payload
   - Event listeners can subscribe (see ADR for event system)
5. **Task/Chain hooks**:
   - Define hook points in task/chain lifecycle
   - Hook definitions in task files or chain metadata
6. **Template interpolation**:
   - `{{taskId}}`, `{{chainId}}`, `{{workflowId}}`, `{{requestId}}`
   - Access to task/chain metadata

---

## Completion Notes

**Completed 2025-12-12** via CHAIN-067-hook-system-design (7 tasks)

Implemented:
- Extended `TransitionAction` union with `SpawnAgentAction`, `PostMessageAction`, `EmitEventAction`
- Added `post_message` action handler with injected `messagePoster`
- Added `emit_event` action handler with injected `eventEmitter`
- Added `spawn_agent` action handler with injected `agentSpawner`
- Template variable interpolation (`{{workflowId}}`, `{{stageIndex}}`, `{{chainId}}`, `{{taskId}}`)
- Task hooks (`onStart`, `onSubmit`, `onApprove`, `onReject`) via `runTaskHook()`
- Chain hooks (`onStart`, `onComplete`, `onApprove`, `onReject`) via `runChainHook()`
- Hook execution logging for all hook types

Files modified:
- `packages/core/src/workflow/types.ts`
- `packages/core/src/workflow/hook-runner.ts`
- `packages/core/src/workflow/templates.ts`
- `packages/core/src/workflow/template-manager.ts`
- `packages/core/src/tasks/types.ts`
- `packages/core/src/workflow/__tests__/hook-runner.test.ts`
- `packages/core/src/workflow/__tests__/templates.test.ts`

Tests: 497 passing (+12 new tests for hook system)
