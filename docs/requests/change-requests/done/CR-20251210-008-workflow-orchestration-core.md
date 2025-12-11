# Change Request: Workflow Orchestration Core

**ID**: CR-20251210-008  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-10  
**Owner**: agent  

---

## What

Add a workflow orchestration layer that sits above the existing agent runtime. Workflows represent the end-to-end execution of a CR/FR through defined stages (design → review → implement → verify) with explicit gates between stages.

This is the "steering and transmission" of the Choragen chassis—it enforces *process*, not just *governance*.

---

## Why

The current agent runtime handles individual sessions with role-gated tools and governance enforcement. But it doesn't enforce *process*:

- Nothing prevents skipping from intent directly to implementation
- No formal gates between design and implementation phases
- No structured way to pause for human review between stages
- No workflow-level state that persists across sessions
- Tools are scoped by role, but not by *stage*

Without workflow orchestration, the assembly line model described in the human-driven development scenario cannot be enforced programmatically.

---

## Scope

**In Scope**:
- `Workflow`, `WorkflowStage`, `StageGate`, `WorkflowMessage` types in `@choragen/core`
- `WorkflowManager` for CRUD operations on workflows
- Workflow templates (standard, hotfix, documentation) as YAML configs
- Stage-scoped tool filtering (extend `ToolRegistry` to filter by stage + role)
- Workflow persistence to `.choragen/workflows/`
- Gate satisfaction logic (auto, human_approval, chain_complete, verification_pass)
- CLI commands: `choragen workflow:start`, `workflow:status`, `workflow:list`, `workflow:advance`
- Integration with existing `runAgentSession` to scope sessions to workflow stages

**Out of Scope**:
- Web UI for workflows (CR-20251210-006)
- Real-time streaming to web (CR-20251210-005)
- Parallel stages or workflow branching (future enhancement)

---

## Acceptance Criteria

- [x] `Workflow` type captures: id, requestId, template, currentStage, status, stages[], messages[]
- [x] `WorkflowStage` type captures: name, type, status, chainId, sessionId, gate, timestamps
- [x] `StageGate` type captures: type (auto|human_approval|chain_complete|verification_pass), satisfied, satisfiedBy, satisfiedAt
- [x] `WorkflowManager.create()` creates workflow from template
- [x] `WorkflowManager.advance()` checks gate satisfaction before advancing
- [x] `WorkflowManager.satisfyGate()` marks gate as satisfied
- [x] Workflow templates loadable from `.choragen/workflow-templates/`
- [x] Default templates (standard, hotfix, documentation) included
- [x] `ToolRegistry.getToolsForStage(role, stageType)` filters tools by stage
- [x] Workflows persist to `.choragen/workflows/*.json`
- [x] `choragen workflow:start <request-id> [--template=standard]` creates and starts workflow
- [x] `choragen workflow:status <workflow-id>` shows current stage and progress
- [x] `choragen workflow:advance <workflow-id>` advances to next stage (if gate satisfied)
- [x] Agent sessions receive stage context and stage-scoped tools

---

## Affected Design Documents

- [Workflow Orchestration](../../../design/core/features/workflow-orchestration.md)
- [Agent Runtime](../../../design/core/features/agent-runtime.md)
- [Human-Driven Development](../../../design/core/scenarios/human-driven-development.md)

---

## Linked ADRs

- ADR-010: Agent Runtime Architecture
- ADR-011: Workflow Orchestration

---

## Dependencies

- None (builds on existing runtime in `@choragen/cli`)

---

## Chain

CHAIN-059-workflow-orchestration

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create/modify:
- `packages/core/src/workflow/` — New module for workflow types and manager
- `packages/cli/src/runtime/tools/registry.ts` — Add stage-scoped filtering
- `packages/cli/src/commands/workflow.ts` — New CLI commands
- `.choragen/workflow-templates/` — Default template files

The workflow manager should be usable from both CLI and web contexts.

---

## Completion Notes

**Completed**: 2025-12-10

### Files Created

**@choragen/core** (`packages/core/src/workflow/`):
- `types.ts` — Workflow, WorkflowStage, StageGate, WorkflowMessage types with enums
- `manager.ts` — WorkflowManager with CRUD, gate handling, pluggable dependencies
- `persistence.ts` — Workflow file persistence with index tracking
- `templates.ts` — Template loader, validator, built-in templates
- `stage-tools.ts` — Stage tool availability matrix
- `index.ts` — Barrel exports
- `__tests__/manager.test.ts` — Manager unit tests
- `__tests__/templates.test.ts` — Template unit tests

**@choragen/cli** (`packages/cli/src/`):
- `commands/workflow.ts` — CLI command implementations
- `commands/index.ts` — Command exports
- `runtime/context.ts` — Workflow session context loader
- `__tests__/workflow-commands.test.ts` — CLI integration tests
- `runtime/__tests__/workflow-session.test.ts` — Runtime integration tests

**Templates** (`templates/workflow-templates/`):
- `standard.yaml` — 5-stage standard workflow
- `hotfix.yaml` — 4-stage hotfix workflow
- `documentation.yaml` — 3-stage documentation workflow

### Files Modified

- `packages/core/src/index.ts` — Export workflow module
- `packages/cli/src/cli.ts` — Wire workflow commands
- `packages/cli/src/runtime/tools/registry.ts` — Add stage-scoped filtering
- `packages/cli/src/runtime/session.ts` — Workflow metadata in session
- `packages/cli/src/runtime/loop.ts` — Workflow context integration

### Verification

- `pnpm build` — All 6 packages built successfully
- `pnpm test` — 769 tests passed
- `pnpm lint` — Passed
