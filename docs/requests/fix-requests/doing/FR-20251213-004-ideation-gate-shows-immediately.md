# Fix Request: Ideation Gate Shows Approval Prompt Immediately

**ID**: FR-20251213-004  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-13  
**Severity**: high  
**Owner**: agent  

---

## Problem

The ideation workflow's exploration stage displays the "Continue to request creation, or discard this idea?" approval prompt immediately when the workflow starts, before the agent has done any exploration work with the user.

---

## Expected Behavior

Per the design doc (`docs/design/core/features/ideation-workflow.md`), the exploration stage flow should be:

1. Human shares idea
2. Agent asks clarifying questions
3. Human responds, refines vision
4. Agent challenges assumptions constructively
5. Agent identifies scope, boundaries, sub-problems
6. Human confirms direction or pivots
7. **THEN** gate appears: "Continue to request creation, or discard?"

The gate prompt should only appear when the agent explicitly requests human approval after completing its exploration work.

---

## Actual Behavior

The gate prompt message is added immediately when:
- A workflow is created (`manager.ts:128`)
- A stage is advanced to (`manager.ts:211`)

This happens via `addGatePromptIfNeeded()` which adds the prompt for any `human_approval` gate without checking if the agent should trigger it first.

---

## Steps to Reproduce

1. Navigate to `/chat`
2. Start an ideation workflow with any idea text
3. Observe the "Approval Required" prompt appears immediately
4. No agent interaction happens before the prompt

---

## Root Cause Analysis

The `StageGate` interface has no mechanism to delay the gate prompt. The current model assumes all `human_approval` gates should show immediately when a stage becomes active. For ideation-style workflows, the agent needs to do work first, then request human approval.

---

## Proposed Fix

1. **Add `agentTriggered` flag to `StageGate`** in `packages/core/src/workflow/types.ts`
   - When `true`, don't show gate prompt immediately

2. **Update `addGatePromptIfNeeded()`** in `packages/core/src/workflow/manager.ts`
   - Skip adding prompt for gates with `agentTriggered: true`

3. **Add `triggerGatePrompt()` method** to `WorkflowManager`
   - Allows programmatic triggering of the gate prompt

4. **Create `request_approval` tool** in `packages/cli/src/runtime/tools/`
   - Agent calls this when ready for human approval
   - Tool calls `triggerGatePrompt()` on the workflow manager

5. **Update ideation template** in `templates/workflow-templates/ideation.yaml`
   - Add `agentTriggered: true` to exploration stage gate

---

## Affected Files

- `packages/core/src/workflow/types.ts`
- `packages/core/src/workflow/manager.ts`
- `packages/core/src/workflow/templates.ts`
- `packages/cli/src/runtime/tools/definitions/` (new tool)
- `packages/cli/src/runtime/tools/index.ts`
- `templates/workflow-templates/ideation.yaml`

---

## Linked ADRs

- ADR-011-workflow-orchestration

---

## Linked Design Docs

- `docs/design/core/features/ideation-workflow.md`
- `docs/design/core/features/workflow-orchestration.md`

---

## Commits

No commits yet.

---

## Verification

- [ ] Bug no longer reproducible
- [ ] Ideation workflow allows agent exploration before gate prompt
- [ ] `request_approval` tool triggers gate prompt correctly
- [ ] Existing workflows with immediate gates still work
- [ ] Tests added for new functionality

---

## Completion Notes

[Added when moved to done/]
