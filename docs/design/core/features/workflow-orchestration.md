# Feature: Workflow Orchestration

**Domain**: core  
**Status**: draft  
**Created**: 2025-12-10  

---

## Overview

Workflow Orchestration adds a **process layer** on top of the Agent Runtime. While the runtime handles individual agent sessions with role-gated tools and governance enforcement, the workflow layer manages **multi-stage processes** with explicit gates between stages.

This is the "assembly line" that ensures work flows through defined stages in order, with appropriate checkpoints for human oversight.

**Implementation references**
- Workflow API and subscriptions: `packages/web/src/server/routers/workflow.ts`
- Workflow chat entrypoint: `packages/web/src/app/chat/[workflowId]/page.tsx`
- Workflow history view: `packages/web/src/app/chat/history/page.tsx`
- Chat components consuming workflow state: `packages/web/src/components/chat/`

---

## Problem

The Agent Runtime (as currently designed) handles:
- Spawning agent sessions with role constraints
- Enforcing governance at tool execution time
- Nesting impl sessions within control sessions

But it doesn't enforce **process**:
- Nothing prevents skipping from intent directly to implementation
- No formal gates between design and implementation
- No structured way to pause for human review
- No workflow-level state that persists across sessions

---

## Solution

A **Workflow** is a first-class entity that:
1. Represents the execution of a CR or FR through the development pipeline
2. Defines **stages** that must be completed in order
3. Enforces **gates** between stages
4. Scopes agent sessions to specific stages
5. Persists state across sessions and restarts

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Workflow Orchestrator                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        Workflow State                            │   │
│  │  - ID, Request ID, Current Stage, Status                        │   │
│  │  - Stage history with timestamps                                 │   │
│  │  - Conversation history (audit trail)                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   │                                     │
│                                   ▼                                     │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐             │
│  │ Stage 1 │───▶│ Stage 2 │───▶│ Stage 3 │───▶│ Stage 4 │             │
│  │ Request │    │ Design  │    │ Impl    │    │ Verify  │             │
│  │         │    │         │    │         │    │         │             │
│  │ Gate:   │    │ Gate:   │    │ Gate:   │    │ Gate:   │             │
│  │ human   │    │ human   │    │ chain   │    │ auto    │             │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘             │
│       │              │              │              │                    │
│       ▼              ▼              ▼              ▼                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Agent Runtime                               │   │
│  │  Sessions scoped to current stage                                │   │
│  │  Tools filtered by stage + role                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### Workflow

A workflow represents the end-to-end execution of a request.

```typescript
interface Workflow {
  /** Unique workflow identifier */
  id: string;
  
  /** The CR or FR this workflow is executing */
  requestId: string;
  
  /** Workflow template used (e.g., "standard", "hotfix") */
  template: string;
  
  /** Current stage index */
  currentStage: number;
  
  /** Overall workflow status */
  status: "active" | "paused" | "completed" | "failed" | "cancelled";
  
  /** Stage definitions and state */
  stages: WorkflowStage[];
  
  /** When the workflow was created */
  createdAt: Date;
  
  /** When the workflow was last updated */
  updatedAt: Date;
  
  /** Conversation history for audit trail */
  messages: WorkflowMessage[];
}
```

### Stage

A stage represents a phase of work with defined entry/exit criteria.

```typescript
interface WorkflowStage {
  /** Stage name */
  name: string;
  
  /** Stage type determines available tools and behaviors */
  type: "request" | "design" | "review" | "implementation" | "verification";
  
  /** Current stage status */
  status: "pending" | "active" | "awaiting_gate" | "completed" | "skipped";
  
  /** Chain created for this stage (if applicable) */
  chainId?: string;
  
  /** Active session working on this stage */
  sessionId?: string;
  
  /** Gate configuration for advancing to next stage */
  gate: StageGate;
  
  /** When this stage started */
  startedAt?: Date;
  
  /** When this stage completed */
  completedAt?: Date;
}
```

### Gate

A gate defines what must happen to advance to the next stage.

```typescript
interface StageGate {
  /** Gate type */
  type: "auto" | "human_approval" | "chain_complete" | "verification_pass";
  
  /** For human_approval: prompt to show */
  prompt?: string;
  
  /** For chain_complete: which chain must complete */
  chainId?: string;
  
  /** For verification_pass: commands that must succeed */
  commands?: string[];
  
  /** Whether the gate has been satisfied */
  satisfied: boolean;
  
  /** Who/what satisfied the gate */
  satisfiedBy?: string;
  
  /** When the gate was satisfied */
  satisfiedAt?: Date;
}
```

### Message

Messages form the conversation history and audit trail.

```typescript
interface WorkflowMessage {
  /** Message ID */
  id: string;
  
  /** Who sent the message */
  role: "human" | "control" | "impl" | "system";
  
  /** Message content */
  content: string;
  
  /** Which stage this message belongs to */
  stageIndex: number;
  
  /** Timestamp */
  timestamp: Date;
  
  /** Optional metadata (tool calls, artifacts, etc.) */
  metadata?: Record<string, unknown>;
}
```

---

## Workflow Templates

Templates define the stages and gates for different types of work.

### Standard Template

For typical feature work following the full pipeline:

```yaml
name: standard
stages:
  - name: request
    type: request
    gate:
      type: human_approval
      prompt: "CR created. Proceed to design?"
      
  - name: design
    type: design
    gate:
      type: human_approval
      prompt: "Design complete. Proceed to implementation?"
      
  - name: implementation
    type: implementation
    gate:
      type: chain_complete
      
  - name: verification
    type: verification
    gate:
      type: verification_pass
      commands:
        - "pnpm build"
        - "pnpm test"
        - "pnpm lint"
        
  - name: completion
    type: review
    gate:
      type: human_approval
      prompt: "All checks pass. Approve and merge?"
```

### Hotfix Template

For urgent fixes that skip design:

```yaml
name: hotfix
stages:
  - name: request
    type: request
    gate:
      type: human_approval
      prompt: "FR created. Proceed directly to implementation?"
      
  - name: implementation
    type: implementation
    gate:
      type: chain_complete
      
  - name: verification
    type: verification
    gate:
      type: verification_pass
      commands:
        - "pnpm build"
        - "pnpm test"
        
  - name: completion
    type: review
    gate:
      type: human_approval
      prompt: "Hotfix ready. Approve and merge?"
```

### Documentation Template

For docs-only changes:

```yaml
name: documentation
stages:
  - name: request
    type: request
    gate:
      type: auto
      
  - name: implementation
    type: implementation
    gate:
      type: chain_complete
      
  - name: completion
    type: review
    gate:
      type: human_approval
      prompt: "Documentation updated. Approve?"
```

---

## Stage-Scoped Tools

Each stage type exposes different tools to the agent:

| Tool | request | design | review | impl | verify |
|------|---------|--------|--------|------|--------|
| `request:create` | ✓ | ✗ | ✗ | ✗ | ✗ |
| `chain:new` | ✗ | ✓ | ✗ | ✗ | ✗ |
| `chain:status` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `task:add` | ✗ | ✓ | ✗ | ✗ | ✗ |
| `task:start` | ✗ | ✗ | ✗ | ✓ | ✗ |
| `task:complete` | ✗ | ✗ | ✗ | ✓ | ✗ |
| `task:approve` | ✗ | ✗ | ✓ | ✗ | ✗ |
| `read_file` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `write_file` (docs) | ✗ | ✓ | ✗ | ✗ | ✗ |
| `write_file` (src) | ✗ | ✗ | ✗ | ✓ | ✗ |
| `run_command` | ✗ | ✗ | ✗ | ✓ | ✓ |
| `spawn_impl` | ✗ | ✗ | ✗ | ✓ | ✗ |
| `gate:satisfy` | ✗ | ✗ | ✓ | ✗ | ✓ |

This is **in addition to** role-based filtering. A control agent in the design stage gets design tools; an impl agent in the implementation stage gets impl tools.

---

## Workflow Lifecycle

### Creation

```typescript
// Human initiates via chat
"We need to add pagination to the backlog"

// System creates workflow
const workflow = await workflowOrchestrator.create({
  requestId: "CR-20251210-004",  // Created by control agent
  template: "standard",
});
```

### Stage Advancement

```typescript
// When gate is satisfied, advance to next stage
async function advanceStage(workflowId: string): Promise<void> {
  const workflow = await getWorkflow(workflowId);
  const currentStage = workflow.stages[workflow.currentStage];
  
  if (!currentStage.gate.satisfied) {
    throw new Error("Gate not satisfied");
  }
  
  // Complete current stage
  currentStage.status = "completed";
  currentStage.completedAt = new Date();
  
  // Advance to next stage
  workflow.currentStage++;
  
  if (workflow.currentStage >= workflow.stages.length) {
    workflow.status = "completed";
  } else {
    const nextStage = workflow.stages[workflow.currentStage];
    nextStage.status = "active";
    nextStage.startedAt = new Date();
  }
  
  await saveWorkflow(workflow);
}
```

### Gate Satisfaction

```typescript
// Human approval gate
async function satisfyHumanGate(
  workflowId: string, 
  stageIndex: number,
  approver: string
): Promise<void> {
  const workflow = await getWorkflow(workflowId);
  const stage = workflow.stages[stageIndex];
  
  stage.gate.satisfied = true;
  stage.gate.satisfiedBy = approver;
  stage.gate.satisfiedAt = new Date();
  stage.status = "awaiting_gate";  // Ready to advance
  
  await saveWorkflow(workflow);
  await advanceStage(workflowId);
}

// Chain complete gate (automatic)
async function onChainComplete(chainId: string): Promise<void> {
  const workflow = await findWorkflowByChain(chainId);
  if (!workflow) return;
  
  const stage = workflow.stages[workflow.currentStage];
  if (stage.gate.type === "chain_complete" && stage.chainId === chainId) {
    stage.gate.satisfied = true;
    stage.gate.satisfiedBy = "system";
    stage.gate.satisfiedAt = new Date();
    
    await saveWorkflow(workflow);
    await advanceStage(workflow.id);
  }
}
```

---

## Persistence

Workflows are persisted to `.choragen/workflows/`:

```
.choragen/
├── workflows/
│   ├── WF-20251210-001.json
│   ├── WF-20251210-002.json
│   └── ...
└── workflow-index.json  # Quick lookup by status, request ID
```

This allows:
- Workflows to survive process restarts
- Multiple workflows to run in parallel
- Historical audit of completed workflows

---

## Integration with Web Chat

The web chat interface interacts with workflows via tRPC:

```typescript
// Start workflow from chat
workflowRouter.create.mutate({ requestId: "CR-20251210-004", template: "standard" });

// Send message to active workflow
workflowRouter.sendMessage.mutate({
  workflowId: "WF-20251210-001",
  role: "human",
  content: "Yes, proceed to implementation",
  stageIndex: 0,
});

// Satisfy gate
workflowRouter.satisfyGate.mutate({
  workflowId: "WF-20251210-001",
  stageIndex: 1,
});

// Get workflow state (for UI)
workflowRouter.get.query("WF-20251210-001");

// Stream messages (for real-time updates)
workflowRouter.onMessage.subscribe({ workflowId: "WF-20251210-001" });

// Pause/Resume/Cancel controls
workflowRouter.pause.mutate({ workflowId: "WF-20251210-001" });
workflowRouter.resume.mutate({ workflowId: "WF-20251210-001" });
workflowRouter.cancel.mutate({ workflowId: "WF-20251210-001" });
```

---

## Acceptance Criteria

- [x] Workflows can be created from a template (`workflow.create`)
- [x] Stages execute in defined order (managed by `WorkflowManager` in `@choragen/core`)
- [x] Gates block advancement until satisfied (`satisfyGate`, gate prompts in chat)
- [x] Human approval gates pause for user input (`gate-prompt.tsx`)
- [x] Chain complete gates auto-advance when chain finishes (`WorkflowManager.ensureGateSatisfied`)
- [x] Verification gates run commands and check results (`WorkflowManager.ensureGateSatisfied`)
- [x] Agent sessions are scoped to current stage (workflow status + sidebar actions)
- [x] Tool availability is filtered by stage type (runtime enforcement)
- [x] Workflow state persists across restarts (`WorkflowManager` storage)
- [x] Conversation history is preserved as audit trail (`workflow.getHistory`, chat onMessage)
- [x] Web chat can create, interact with, and monitor workflows (`workflow` router + chat UI)

---

## Linked Scenarios

- [Human-Driven Development](../scenarios/human-driven-development.md)
- [Agent Runtime Orchestration](../scenarios/agent-runtime-orchestration.md)

---

## Linked Features

- [Agent Runtime](./agent-runtime.md)
- [Web Chat Interface](./web-chat-interface.md) (to be created)
- [Task Chain Management](./task-chain-management.md)
- [Standard Workflow](./standard-workflow.md) — Detailed 8-stage workflow with three-tier review
- [Ideation Workflow](./ideation-workflow.md) — Dedicated workflow for idea exploration
- [Specialized Agent Roles](./specialized-agent-roles.md) — Role definitions used by workflows

---

## Linked ADRs

- ADR-010: Agent Runtime Architecture
- ADR-011: Workflow Orchestration
- ADR-012: Event-Driven Orchestration

---

## Open Questions

1. ~~**Parallel stages** — Should some stages be able to run in parallel?~~ Addressed: Chains within a stage can run in parallel if file scopes don't overlap. See [Standard Workflow](./standard-workflow.md).
2. **Stage rollback** — Can we go back to a previous stage if issues are found?
3. **Workflow branching** — Can a workflow spawn sub-workflows?
4. **Template customization** — Can users modify templates per-workflow?
5. **Timeout handling** — What happens if a stage stalls?

---

## Related Workflow Definitions

This document describes the **orchestration infrastructure**. For specific workflow definitions, see:

- [Standard Workflow](./standard-workflow.md) — 8-stage workflow for committed requests
- [Ideation Workflow](./ideation-workflow.md) — 3-stage workflow for idea exploration
