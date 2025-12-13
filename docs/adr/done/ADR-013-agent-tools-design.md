# ADR-013: Agent Tools Design

**Status**: done  
**Created**: 2025-12-12  
**Linked CR/FR**: CR-20251212-005  
**Linked Design Docs**: docs/design/core/features/standard-workflow.md, docs/design/core/features/ideation-workflow.md, docs/design/core/features/role-based-tool-access.md  

---

## Context

The Ideation and Standard workflows require agents to perform structured actions that don't exist as tools yet. ADR-010 established the Agent Runtime Architecture with role-gated tool sets, but the specific tools for workflow execution are not fully implemented.

Currently missing tools fall into five categories:
1. **Task lifecycle** — `task:submit`, `task:request_changes` (task:approve exists)
2. **Chain lifecycle** — `chain:approve`, `chain:request_changes`
3. **Request lifecycle** — `request:create`, `request:approve`, `request:request_changes`
4. **Feedback** — `feedback:create` for async human input
5. **Git operations** — `git:status`, `git:diff`, `git:commit`, `git:branch`, `git:push`

The existing `spawn_impl_session` tool is specific to impl agents; a generic `spawn_agent` is needed for role-flexible spawning.

---

## Decision

### 1. Tool Naming Convention

All tools follow the pattern `<domain>:<action>`:
- `task:submit`, `task:approve`, `task:request_changes`
- `chain:approve`, `chain:request_changes`
- `request:create`, `request:approve`, `request:request_changes`
- `feedback:create`
- `git:status`, `git:diff`, `git:commit`, `git:branch`, `git:push`

Exception: `spawn_agent` uses underscore for consistency with existing `spawn_impl_session`.

### 2. Tool Categories

Tools are organized into categories for role-based filtering:

| Category | Tools | Roles |
|----------|-------|-------|
| `task` | task:submit, task:approve, task:request_changes | impl (submit), review (approve, request_changes) |
| `chain` | chain:approve, chain:request_changes | review |
| `request` | request:create, request:approve, request:request_changes | ideation (create), review (approve, request_changes) |
| `feedback` | feedback:create | impl, design |
| `git` | git:* | commit |
| `session` | spawn_agent | orchestration, control |

### 3. Tool Parameter Design

Each tool receives minimal, typed parameters:

```typescript
// task:submit
{ chainId: string, taskId: string, summary?: string }

// task:request_changes
{ chainId: string, taskId: string, reason: string, suggestions?: string[] }

// chain:approve / chain:request_changes
{ chainId: string, reason?: string }

// request:create
{ type: 'cr' | 'fr', title: string, domain: string, content: string }

// feedback:create
{ workflowId: string, question: string, context?: string, blocking?: boolean }

// spawn_agent
{ role: string, chainId?: string, taskId?: string, context?: string }

// git:commit
{ message: string, files?: string[] }
```

### 4. State Transitions

Tools that change state emit events for orchestration:

| Tool | State Change | Event |
|------|--------------|-------|
| `task:submit` | in-progress → in-review | `task.submitted` |
| `task:approve` | in-review → done | `task.approved` |
| `task:request_changes` | in-review → in-progress | `task.changes_requested` |
| `chain:approve` | — | `chain.approved` |
| `chain:request_changes` | — | `chain.changes_requested` |
| `request:approve` | — | `request.approved` |
| `feedback:create` | — | `feedback.created` |

### 5. Git Tool Safety

Git tools have additional safeguards:
- `git:commit` validates commit message format (type, scope, CR/FR reference)
- `git:push` requires human approval gate in workflow
- `git:branch` only allows branch creation, not deletion
- All git tools log to audit trail

### 6. Feedback Tool Behavior

`feedback:create` supports both blocking and non-blocking modes:
- **Blocking** (`blocking: true`): Workflow pauses until human responds
- **Non-blocking** (`blocking: false`): Agent continues, response arrives asynchronously

---

## Consequences

**Positive**:
- Consistent naming convention across all tools
- Clear role-based access control
- Event-driven state transitions enable orchestration
- Git safety prevents accidental damage
- Feedback tool enables human-in-the-loop without blocking

**Negative**:
- 13 new tools to implement and maintain
- Tool schema must stay in sync with governance rules
- Git tools add complexity around credential handling

**Mitigations**:
- Generate tool schemas from a single source of truth
- Use existing git credential helpers (no custom auth)
- Comprehensive test coverage for each tool

---

## Alternatives Considered

### Alternative 1: Coarse-Grained Tools

Combine related tools (e.g., single `task:transition` instead of submit/approve/request_changes).

**Rejected because**: Fine-grained tools enable precise role-based access. A review agent should be able to approve but not submit.

### Alternative 2: Generic CRUD Tools

Use generic `create`, `update`, `delete` tools with entity type parameter.

**Rejected because**: Loses semantic clarity and makes role-based filtering harder. `task:approve` is clearer than `update({ entity: 'task', action: 'approve' })`.

### Alternative 3: Git via Shell Commands

Use `run_command` for git operations instead of dedicated tools.

**Rejected because**: Dedicated tools enable validation, audit logging, and safety checks. Raw shell access is too permissive.

---

## Implementation

[Added when moved to done/]

- packages/cli/src/runtime/tools/task-tools.ts
- packages/cli/src/runtime/tools/chain-tools.ts
- packages/cli/src/runtime/tools/request-tools.ts
- packages/cli/src/runtime/tools/feedback-tools.ts
- packages/cli/src/runtime/tools/git-tools.ts
- packages/cli/src/runtime/tools/session-tools.ts
- .choragen/tools/index.yaml (updated)
