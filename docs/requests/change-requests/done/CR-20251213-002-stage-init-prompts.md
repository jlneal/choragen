# Change Request: Stage Initialization Prompts

**ID**: CR-20251213-002  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-13  
**Owner**: agent  

---

## What

Add **initialization prompts** to workflow stages that inject stage-specific context and instructions when an agent begins working on a stage. This includes:

- `initPrompt` field in stage definitions (workflow templates)
- Prompt injection into agent context when stage activates
- Template variable support in prompts (e.g., `{{requestId}}`, `{{chainId}}`)
- Init prompts for all existing stages in standard/hotfix/ideation templates
- Corresponding reduction in AGENTS.md scope (remove stage-specific guidance)

---

## Why

Currently, stage-specific behavior is either:

1. **Implicit** — Agents infer what to do from stage type/name
2. **In AGENTS.md** — General guidance that may not apply to all stages
3. **Missing** — No structured way to inject stage-specific instructions

Problems with current approach:

- **AGENTS.md bloat** — Contains too much stage-specific detail
- **Inconsistent behavior** — Agents may interpret stages differently
- **No customization** — Can't tailor prompts per workflow template
- **Lost context** — Stage intent not explicitly communicated

Init prompts solve this by:

- **Explicit instructions** — Each stage declares what agents should do
- **Template-specific** — Different workflows can have different prompts
- **Reduced AGENTS.md** — General conventions only, not stage behavior
- **Extensible** — New stages (like `reflection`) can define their own prompts

---

## Scope

**In Scope**:
- Add `initPrompt` field to `WorkflowStage` type
- Add `initPrompt` to stage schema in workflow templates
- Implement prompt injection in `WorkflowManager` when stage activates
- Support template variables in prompts (`{{requestId}}`, `{{chainId}}`, etc.)
- Add init prompts to all stages in:
  - `standard.yaml`
  - `hotfix.yaml`
  - `ideation.yaml`
  - `documentation.yaml`
- Update AGENTS.md to remove stage-specific guidance
- Add `initPrompt` field to stage editor in web UI

**Out of Scope**:
- Dynamic prompt generation based on context
- Prompt versioning/history
- Prompt A/B testing
- Multi-language prompt support

---

## Affected Design Documents

- docs/design/core/features/workflow-orchestration.md
- docs/design/core/features/web-chat-interface.md

---

## Linked ADRs

- ADR-011: Workflow Orchestration
- ADR-TBD: Stage Initialization Prompts

---

## Commits

No commits yet.

---

## Implementation Notes

### Schema Addition

```typescript
export interface WorkflowStage {
  name: string;
  type: StageType;
  status: StageStatus;
  roleId?: string;
  
  /** Prompt injected into agent context when stage activates */
  initPrompt?: string;
  
  gate: StageGate;
  hooks?: StageTransitionHooks;
  // ...
}
```

### Template Example

```yaml
stages:
  - name: reflection
    type: review
    roleId: control
    initPrompt: |
      You are completing the reflection stage for fix request {{requestId}}.
      
      Review the fix that was implemented and answer:
      1. Why did this bug occur?
      2. What allowed it to reach this stage (testing gap, review gap, etc.)?
      3. How could it have been prevented or caught earlier?
      
      Generate improvement suggestions using the suggestion:create tool.
      Categories: lint, workflow, environment, documentation, testing, commit-hook, workflow-hook.
    gate:
      type: human_approval
      prompt: "Reflection complete. Review suggestions?"
```

### AGENTS.md Scope Reduction

After this CR, AGENTS.md should contain:
- Project structure and conventions
- Role boundaries (impl vs control)
- Commit discipline
- Validation commands
- General coding conventions

AGENTS.md should NOT contain:
- Stage-specific instructions (moved to initPrompt)
- Workflow-specific behavior (defined in templates)
- Tool usage guidance (moved to tool descriptions or role prompts)

---

## Completion Notes

**Completed**: 2025-12-14
**Chain**: CHAIN-073-stage-init-prompts (10 tasks)

### Summary

Implemented stage initialization prompts across the entire workflow system:

1. **Type System** (T001): Added `initPrompt?: string` to `WorkflowStage` type
2. **Prompt Injection** (T002): Inject initPrompt into agent context when stage activates
3. **Template Variables** (T003): Support `{{requestId}}`, `{{workflowId}}`, `{{chainId}}`, `{{stageName}}`, `{{stageType}}`
4. **Standard Template** (T004): Added initPrompt to all 8 stages in standard.yaml
5. **Hotfix Template** (T005): Added initPrompt to all 4 stages in hotfix.yaml
6. **Ideation Template** (T006): Added initPrompt to all 3 stages in ideation.yaml
7. **Documentation Template** (T007): Added initPrompt to all 3 stages in documentation.yaml
8. **Web UI** (T008): Added initPrompt field to stage editor
9. **AGENTS.md Cleanup** (T009): Removed stage-specific guidance (now in initPrompt)
10. **Verification** (T010): All tests pass (541 core, 770 CLI), lint passes

### Files Modified

- `packages/core/src/workflow/types.ts`
- `packages/core/src/workflow/templates.ts`
- `packages/core/src/workflow/manager.ts`
- `packages/cli/src/runtime/loop.ts`
- `packages/cli/src/runtime/__tests__/loop.test.ts`
- `packages/web/src/components/workflows/template-form.tsx`
- `packages/web/src/components/workflows/stage-editor.tsx`
- `templates/workflow-templates/standard.yaml`
- `templates/workflow-templates/hotfix.yaml`
- `templates/workflow-templates/ideation.yaml`
- `templates/workflow-templates/documentation.yaml`
- `AGENTS.md`
- `docs/agents/control-agent.md`
