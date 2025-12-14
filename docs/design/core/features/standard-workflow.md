# Feature: Standard Workflow

**Domain**: core  
**Status**: draft  
**Created**: 2025-12-12  

---

## Overview

The Standard Workflow is the primary workflow for executing committed requests. It provides an 8-stage process from planning through completion, with three-tier review (task, chain, request) and event-driven orchestration.

This workflow takes a request from `todo/` and produces completed, committed work.

---

## Design Principles

### Deterministic Scaffolding

The workflow enforces reliability through:
- **Hooks** for rote actions (file moves, status updates, agent spawning)
- **Gates** for explicit checkpoints (human approval, verification)
- **Event-driven orchestration** (not polling)

Agents focus on thinking and creating; the system handles bookkeeping.

### Three-Tier Review

Every piece of work is reviewed before being marked complete:
1. **Task Review** — Each task reviewed by Review Agent
2. **Chain Review** — Each chain reviewed for coherence
3. **Request Review** — Full request reviewed for traceability

### Chain Completion Gate

Chain completion now includes an automatic validation gate that runs before a chain is considered done. The gate executes the chain completion validation runner (`runChainValidation`) via the chain hook system and fails fast with actionable feedback if required checks (task state, completion notes, acceptance criteria, design doc updates, test coverage) are not satisfied.

### Parallel Chains

Chains are parallelizable sequences of tasks. File scopes prevent collisions:
- Each task declares which files it will modify
- Chains with non-overlapping scopes run concurrently
- Orchestration agent manages spawning and coordination

---

## Workflow Stages

| Stage | Role | Gate | Purpose |
|-------|------|------|---------|
| **planning** | Orchestration | human_approval | Break request into design chains |
| **design** | Design + Review | chain_complete | Execute design tasks with review |
| **impl-planning** | Orchestration | human_approval | Break design into impl chains |
| **implementation** | Implementation + Review | chain_complete | Execute impl tasks with review |
| **verification** | System | verification_pass | Run build/test/lint |
| **commit** | Commit | human_approval | Create commits with CR reference |
| **request-review** | Review | human_approval | Final review of entire request |
| **completion** | Control | human_approval | Push and close |

---

## Stage Details

### Stage 1: Planning

**Role**: Orchestration Agent  
**Purpose**: Break request into design chains

| Step | Actor | Type | Action |
|------|-------|------|--------|
| 1.1 | ⚙️ Hook | hook | `onEnter`: Move request from `todo/` to `doing/` |
| 1.2 | 🤖 Orchestration | agent | Reads request, identifies design work needed |
| 1.3 | 🤖 Orchestration | agent | Identifies which design artifacts to create/update |
| 1.4 | 🤖 Orchestration | agent | Creates design chain(s), assigns file scopes |
| 1.5 | 🔧 Tool | tool | `chain:new` — creates chain with file scope |
| 1.6 | 🔧 Tool | tool | `task:add` — creates task files, adds to chain |
| 1.7 | 🚪 Gate | gate | `human_approval`: "Design chains ready. Proceed?" |

#### Design Artifacts

- Scenarios
- Use cases
- Features
- Enhancements
- ADRs

---

### Stage 2: Design Execution

**Role**: Design Agent (per task), Review Agent (per task/chain), Orchestration Agent (coordinator)  
**Purpose**: Execute design tasks with review

| Step | Actor | Type | Action |
|------|-------|------|--------|
| 2.1 | ⚙️ Hook | hook | `onEnter`: For each chain, spawn Design agent for first task |
| **Per Task:** |
| 2.2 | ⚙️ Hook | hook | Task `onEnter`: Move task to `in-progress/` |
| 2.3 | 🤖 Design | agent | Reads task, creates/updates design artifact |
| 2.4 | 🔧 Tool | tool | `write_file` — writes design doc/ADR |
| 2.5 | 🔧 Tool | tool | `task:submit` — submits task for review |
| 2.6 | ⚙️ Hook | hook | Task submitted: Move to `in-review/`, spawn Review agent |
| **Task Review:** |
| 2.7 | 🤖 Review | agent | Reviews work against acceptance criteria |
| 2.8a | 🔧 Tool | tool | If pass: `task:approve` |
| 2.8b | 🔧 Tool | tool | If fail: `task:request_changes` — returns to Design agent |
| 2.9 | ⚙️ Hook | hook | Task approved: Move to `done/`, notify Orchestration |
| **End per-task** |
| **Chain Review:** |
| 2.10 | ⚙️ Hook | hook | All tasks done: Spawn Review agent for chain review |
| 2.11 | 🤖 Review | agent | Reviews chain coherence and completeness |
| 2.12 | 🔧 Tool | tool | `chain:approve` or `chain:request_changes` |
| 2.13 | 🚪 Gate | gate | `chain_complete`: All design chains approved |

---

### Stage 3: Implementation Planning

**Role**: Orchestration Agent  
**Purpose**: Break design into implementation chains

| Step | Actor | Type | Action |
|------|-------|------|--------|
| 3.1 | 🤖 Orchestration | agent | Reads completed design artifacts |
| 3.2 | 🤖 Orchestration | agent | Identifies implementation tasks |
| 3.3 | 🤖 Orchestration | agent | Assigns file scopes to avoid collisions |
| 3.4 | 🔧 Tool | tool | `chain:new` — creates impl chain(s) with file scopes |
| 3.5 | 🔧 Tool | tool | `task:add` — creates task files with file scopes |
| 3.6 | 🚪 Gate | gate | `human_approval`: "Implementation chains ready. Proceed?" |

---

### Stage 4: Implementation Execution

**Role**: Implementation Agent (per task), Review Agent (per task/chain), Orchestration Agent (coordinator)  
**Purpose**: Execute implementation tasks with review

| Step | Actor | Type | Action |
|------|-------|------|--------|
| 4.1 | ⚙️ Hook | hook | `onEnter`: For each chain, spawn Impl agent for first task |
| **Per Task:** |
| 4.2 | ⚙️ Hook | hook | Task `onEnter`: Move task to `in-progress/` |
| 4.3 | 🤖 Implementation | agent | Reads task, implements code/tests |
| 4.4 | 🔧 Tool | tool | `write_file` — writes code |
| 4.5 | 🔧 Tool | tool | `run_command` — runs tests locally |
| 4.6 | 🔧 Tool | tool | `feedback:create` — if blocked/unclear |
| 4.7 | 👤 Human | input | Responds to feedback (async, if any) |
| 4.8 | 🔧 Tool | tool | `task:submit` — submits task for review |
| 4.9 | ⚙️ Hook | hook | Task submitted: Move to `in-review/`, spawn Review agent |
| **Task Review:** |
| 4.10 | 🤖 Review | agent | Reviews code against acceptance criteria |
| 4.11a | 🔧 Tool | tool | If pass: `task:approve` |
| 4.11b | 🔧 Tool | tool | If fail: `task:request_changes` — returns to Impl agent |
| 4.12 | ⚙️ Hook | hook | Task approved: Move to `done/`, notify Orchestration |
| **End per-task** |
| **Chain Review:** |
| 4.13 | ⚙️ Hook | hook | All tasks done: Spawn Review agent for chain review |
| 4.14 | 🤖 Review | agent | Reviews chain as a whole |
| 4.15 | 🔧 Tool | tool | `chain:approve` or `chain:request_changes` |
| 4.16 | 🚪 Gate | gate | `chain_complete`: All impl chains approved (validation gate runs via `onComplete` hooks) |

---

### Stage 5: Verification

**Role**: System (automated)  
**Purpose**: Run build/test/lint

| Step | Actor | Type | Action |
|------|-------|------|--------|
| 5.1 | ⚙️ Hook | hook | `onEnter`: Log verification start |
| 5.2 | 🚪 Gate | gate | `verification_pass`: Runs commands |
| 5.2a | ⚙️ System | script | `pnpm build` |
| 5.2b | ⚙️ System | script | `pnpm test` |
| 5.2c | ⚙️ System | script | `pnpm lint` |
| 5.3 | ⚙️ Hook | hook | `onExit`: Log verification result |

If verification fails, workflow pauses for investigation.

---

### Stage 6: Commit

**Role**: Commit Agent  
**Purpose**: Create commits with proper references

| Step | Actor | Type | Action |
|------|-------|------|--------|
| 6.1 | 🤖 Commit | agent | Reviews changes, groups into logical commits |
| 6.2 | 🔧 Tool | tool | `git:status` — check staged files |
| 6.3 | 🤖 Commit | agent | Drafts commit message(s) with CR reference |
| 6.4 | 🔧 Tool | tool | `git:commit` — creates commit(s) |
| 6.5 | ⚙️ Hook | hook | `post_commit` gate triggers async audit chain creation |
| 6.6 | 🚪 Gate | gate | `human_approval`: "Commits ready. Push?" |

**Post-Commit Gate**: After `git:commit` completes, a `post_commit` gate fires asynchronously to create an audit chain. This does not block workflow progression — the audit runs in parallel and produces advisory `audit` feedback items. The gate can be disabled via `auditEnabled: false` in the workflow template.

---

### Stage 7: Request Review

**Role**: Review Agent  
**Purpose**: Final review of entire request

| Step | Actor | Type | Action |
|------|-------|------|--------|
| 7.1 | 🤖 Review | agent | Reviews entire request: all chains, all artifacts |
| 7.2 | 🤖 Review | agent | Verifies traceability (request → design → impl → commits) |
| 7.3 | 🔧 Tool | tool | `request:approve` or `request:request_changes` |
| 7.4 | 🚪 Gate | gate | `human_approval`: "Request complete. Approve and push?" |

---

### Stage 8: Completion

**Role**: Control Agent  
**Purpose**: Final human approval and closure

| Step | Actor | Type | Action |
|------|-------|------|--------|
| 8.1 | 👤 Human | input | Reviews, approves |
| 8.2 | 🔧 Tool | tool | `git:push` — pushes to remote |
| 8.3 | ⚙️ Hook | hook | `onExit`: Move request to `done/`, update completion notes |
| 8.4 | ⚙️ Hook | hook | `onExit`: Archive completed chains |

---

## Event-Driven Orchestration

The Orchestration agent doesn't poll. Events drive progression:

```
Task Complete → Hook → Update Status → Notify Orchestrator → Spawn Next Agent
```

### Event Flow

1. **Task approved** → Hook updates chain status, emits event
2. **Orchestrator receives event** → Checks if more tasks in chain
3. **If yes** → Spawns agent for next task
4. **If no** → Triggers chain review
5. **Chain approved** → Hook updates workflow status
6. **All chains approved** → Gate satisfied, workflow advances

---

## File Scopes

Tasks and chains declare file scopes to enable safe parallelism:

```yaml
chain:
  id: CHAIN-001
  fileScope:
    - "packages/core/src/workflow/**"
    - "packages/core/src/hooks/**"
  tasks:
    - id: 001
      fileScope:
        - "packages/core/src/workflow/manager.ts"
    - id: 002
      fileScope:
        - "packages/core/src/hooks/runner.ts"
```

Chains with non-overlapping scopes can run in parallel.

---

## Workflow Template

```yaml
name: standard
displayName: Standard Workflow
description: Execute a committed request through design, implementation, and completion

stages:
  - name: planning
    type: design
    role: orchestration
    gate:
      type: human_approval
      prompt: "Design chains ready. Proceed?"
    onEnter:
      - type: file_move
        from: "docs/requests/change-requests/todo/{{requestId}}.md"
        to: "docs/requests/change-requests/doing/{{requestId}}.md"

  - name: design
    type: implementation
    role: design
    gate:
      type: chain_complete
    onEnter:
      - type: command
        command: "choragen chain:spawn-agents {{chainIds}}"

  - name: impl-planning
    type: design
    role: orchestration
    gate:
      type: human_approval
      prompt: "Implementation chains ready. Proceed?"

  - name: implementation
    type: implementation
    role: implementation
    gate:
      type: chain_complete
    onEnter:
      - type: command
        command: "choragen chain:spawn-agents {{chainIds}}"

  - name: verification
    type: verification
    gate:
      type: verification_pass
      commands:
        - "pnpm build"
        - "pnpm test"
        - "pnpm lint"

  - name: commit
    type: implementation
    role: commit
    gate:
      type: human_approval
      prompt: "Commits ready. Push?"

  - name: request-review
    type: review
    role: review
    gate:
      type: human_approval
      prompt: "Request complete. Approve and push?"

  - name: completion
    type: review
    role: control
    gate:
      type: human_approval
      prompt: "Final approval. Close request?"
    onExit:
      - type: file_move
        from: "docs/requests/change-requests/doing/{{requestId}}.md"
        to: "docs/requests/change-requests/done/{{requestId}}.md"
      - type: command
        command: "choragen request:close {{requestId}}"
```

---

## Acceptance Criteria

- [ ] Standard workflow template with 8 stages
- [ ] Three-tier review: task, chain, request
- [ ] Event-driven orchestration (not polling)
- [ ] File scopes on tasks and chains
- [ ] Hooks for file moves and status updates
- [ ] Parallel chain execution with non-overlapping scopes
- [ ] Human approval gates at key checkpoints
- [ ] Verification stage runs build/test/lint
- [ ] Commit stage creates properly formatted commits
- [ ] Completion stage closes request and archives chains

---

## Linked Scenarios

- [Human-Driven Development](../scenarios/human-driven-development.md)
- [Agent Runtime Orchestration](../scenarios/agent-runtime-orchestration.md)

---

## Linked Features

- [Specialized Agent Roles](./specialized-agent-roles.md)
- [Agent Feedback](./agent-feedback.md)
- [Ideation Workflow](./ideation-workflow.md)
- [Workflow Orchestration](./workflow-orchestration.md)

---

## Open Questions

1. **Retry semantics** — How many times can a task be sent back for changes?
2. **Partial rollback** — If chain review fails, do all tasks need rework?
3. **Scope conflicts** — What happens if file scopes overlap unexpectedly?
4. **Verification failure** — Who investigates? Orchestrator or human?
