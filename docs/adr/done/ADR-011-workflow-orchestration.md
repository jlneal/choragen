# ADR-011: Workflow Orchestration

**Status**: done  
**Created**: 2025-12-10  
**Linked CR/FR**: CR-20251210-004  
**Linked Design Docs**: docs/design/core/features/workflow-orchestration.md  

---

## Context

The Agent Runtime (ADR-010) handles individual agent sessions with role-gated tools and governance enforcement. However, it doesn't enforce **process**:

- Nothing prevents skipping from intent directly to implementation
- No formal gates between design and implementation phases
- No structured way to pause for human review between stages
- No workflow-level state that persists across sessions
- Tools are scoped by role, but not by *stage*

The human-driven development scenario requires an "assembly line" model where work flows through defined stages (request → design → implementation → verification) with explicit checkpoints.

---

## Decision

Implement a **Workflow Orchestration** layer that sits above the Agent Runtime:

1. **Workflow** is a first-class entity representing end-to-end execution of a CR/FR
2. **Stages** define phases of work that must complete in order
3. **Gates** block advancement between stages until satisfied
4. **Stage-scoped tools** filter available tools by both role AND stage type
5. **Persistence** to `.choragen/workflows/` enables state across sessions

### Core Types

```typescript
interface Workflow {
  id: string;
  requestId: string;
  template: string;
  currentStage: number;
  status: "active" | "paused" | "completed" | "failed" | "cancelled";
  stages: WorkflowStage[];
  createdAt: Date;
  updatedAt: Date;
  messages: WorkflowMessage[];
}

interface WorkflowStage {
  name: string;
  type: "request" | "design" | "review" | "implementation" | "verification";
  status: "pending" | "active" | "awaiting_gate" | "completed" | "skipped";
  chainId?: string;
  sessionId?: string;
  gate: StageGate;
  startedAt?: Date;
  completedAt?: Date;
}

interface StageGate {
  type: "auto" | "human_approval" | "chain_complete" | "verification_pass";
  prompt?: string;
  chainId?: string;
  commands?: string[];
  satisfied: boolean;
  satisfiedBy?: string;
  satisfiedAt?: Date;
}

interface WorkflowMessage {
  id: string;
  role: "human" | "control" | "impl" | "system";
  content: string;
  stageIndex: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}
```

### Gate Types

| Gate Type | Satisfaction Condition |
|-----------|------------------------|
| `auto` | Immediately satisfied when stage completes |
| `human_approval` | Requires explicit human approval |
| `chain_complete` | Satisfied when linked task chain completes |
| `verification_pass` | Satisfied when all verification commands pass |

### Workflow Templates

Templates define stage sequences for different work types:

- **standard**: request → design → implementation → verification → completion
- **hotfix**: request → implementation → verification → completion
- **documentation**: request → implementation → completion

Templates stored in `.choragen/workflow-templates/` as YAML.

---

## Consequences

**Positive**:
- Enforces process discipline programmatically
- Provides explicit human review points
- Creates audit trail of all workflow activity
- Enables stage-appropriate tool filtering
- Supports different workflows for different work types

**Negative**:
- Adds complexity to the system
- Requires coordination between workflow layer and runtime
- Templates may need customization per project

**Mitigations**:
- Keep WorkflowManager API simple with clear separation from runtime
- Provide sensible default templates that work for most cases
- Allow template customization via project config

---

## Alternatives Considered

### Alternative 1: Implicit Stage Detection

Infer current stage from artifacts (e.g., if design doc exists, we're past design stage).

**Rejected because**: Too fragile, doesn't support explicit gates, no audit trail, can't enforce human review points.

### Alternative 2: Extend Task Chains

Add stage concepts directly to task chains instead of separate workflow layer.

**Rejected because**: Task chains are for tracking implementation work within a stage. Workflows are higher-level process orchestration. Mixing concerns would complicate both.

### Alternative 3: External Workflow Engine

Use an existing workflow engine (e.g., Temporal, Prefect).

**Rejected because**: Overkill for our needs, adds significant infrastructure dependency, harder to integrate with our specific agent runtime model.

---

## Implementation

[Added when moved to done/]

- `packages/core/src/workflow/types.ts`
- `packages/core/src/workflow/manager.ts`
- `packages/core/src/workflow/templates.ts`
- `packages/cli/src/commands/workflow.ts`
- `packages/cli/src/runtime/tools/registry.ts` (stage filtering)
