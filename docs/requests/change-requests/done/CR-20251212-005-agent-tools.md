# Change Request: Agent Tools

**ID**: CR-20251212-005  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-12  
**Owner**: agent  

---

## What

Implement the agent tools required for the Ideation and Standard workflows. These tools enable agents to manage task/chain/request lifecycles, create feedback, spawn other agents, and perform git operations.

### Task Lifecycle Tools
| Tool | Purpose |
|------|---------|
| `task:submit` | Submit task for review (moves to in-review) |
| `task:approve` | Approve reviewed task (moves to done) |
| `task:request_changes` | Request changes on task (returns to agent) |

### Chain Lifecycle Tools
| Tool | Purpose |
|------|---------|
| `chain:approve` | Approve reviewed chain |
| `chain:request_changes` | Request changes on chain |

### Request Lifecycle Tools
| Tool | Purpose |
|------|---------|
| `request:create` | Create request doc in backlog |
| `request:approve` | Approve reviewed request |
| `request:request_changes` | Request changes on request |

### Feedback Tools
| Tool | Purpose |
|------|---------|
| `feedback:create` | Create feedback item for human response |

### Agent Management Tools
| Tool | Purpose |
|------|---------|
| `spawn_agent` | Spawn agent with specific role and context |

### Git Tools
| Tool | Purpose |
|------|---------|
| `git:status` | Check git status |
| `git:diff` | View git diff |
| `git:commit` | Create commit with message |
| `git:branch` | Manage branches |
| `git:push` | Push to remote |

---

## Why

The Ideation and Standard workflows require agents to perform structured actions that don't exist as tools yet:

1. **Task review flow** — Agents need to submit work for review, and reviewers need to approve or request changes
2. **Chain/request review** — Same pattern at chain and request level
3. **Feedback** — Agents need to request human input without blocking
4. **Agent spawning** — Orchestration needs to spawn specialized agents
5. **Git operations** — Commit agent needs version control access

Without these tools, the workflows cannot be executed.

---

## Scope

**In Scope**:
- 15 new tools as listed above
- Tool definitions with parameters and validation
- Integration with existing managers (TaskManager, ChainManager, etc.)
- Tool metadata for role-based access
- CLI commands that back the tools (where applicable)

**Out of Scope**:
- UI for tool invocation (agents use tools, not humans directly)
- Tool versioning
- Tool analytics/metrics

---

## Affected Design Documents

- docs/design/core/features/standard-workflow.md
- docs/design/core/features/ideation-workflow.md
- docs/design/core/features/specialized-agent-roles.md
- docs/design/core/features/agent-feedback.md
- docs/design/core/features/role-based-tool-access.md

---

## Linked ADRs

- ADR-010: Agent Runtime Architecture
- ADR-013: Agent Tools Design

---

## Chain

**Chain ID**: CHAIN-068-agent-tools  
**Tasks**: 8 tasks (T001-T008)

## Commits

No commits yet.

---

## Implementation Notes

Key implementation areas:

### Task Tools
1. `task:submit` — Update task status to `in-review`, emit event
2. `task:approve` — Update task status to `done`, emit event
3. `task:request_changes` — Add change request to task, notify original agent

### Chain Tools
4. `chain:approve` — Mark chain as approved
5. `chain:request_changes` — Add change request to chain

### Request Tools
6. `request:create` — Create request doc from template in backlog
7. `request:approve` — Mark request as approved
8. `request:request_changes` — Add change request to request

### Feedback Tools
9. `feedback:create` — Create FeedbackItem, persist to workflow

### Agent Tools
10. `spawn_agent` — Create agent session with role config, inject context

### Git Tools
11-15. Wrap git commands with proper error handling and output parsing

### Tool Registration
- Register all tools in ToolRegistry
- Add to `.choragen/tools/index.yaml`
- Assign to appropriate roles in `.choragen/roles/index.yaml`

---

## Completion Notes

Completed 2025-12-12. All 14 agent tools implemented across 8 tasks in CHAIN-068:

**Task Tools**: `task:submit`, `task:request_changes` — lifecycle transitions with event emission

**Chain Tools**: `chain:approve`, `chain:request_changes` — chain review actions with events

**Request Tools**: `request:create`, `request:approve`, `request:request_changes` — template-based request creation and review

**Feedback Tools**: `feedback:create` — blocking/non-blocking feedback with workflow pause support

**Session Tools**: `spawn_agent` — role-flexible nested agent spawning with privilege guards

**Git Tools**: `git:status`, `git:diff`, `git:commit`, `git:branch`, `git:push` — safe git operations with commit message validation

**Key Files**:
- `packages/cli/src/runtime/tools/{task,chain,request,feedback,session,git}-tools.ts`
- `packages/cli/src/runtime/tools/{index,registry,executor}.ts`
- `.choragen/tools/index.yaml`
- `packages/cli/src/runtime/__tests__/tool-integration.test.ts`
- Unit tests for each tool category
