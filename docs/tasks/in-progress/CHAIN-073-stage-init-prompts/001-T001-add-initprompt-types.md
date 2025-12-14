# Task: Add initPrompt field to WorkflowStage and WorkflowTemplateStage types

**Chain**: CHAIN-073-stage-init-prompts  
**Task**: 001-T001-add-initprompt-types  
**Status**: in-progress  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Add the `initPrompt` optional field to both `WorkflowStage` and `WorkflowTemplateStage` types. This field will hold stage-specific instructions that are injected into agent context when a stage activates.

---

## Expected Files

- `packages/core/src/workflow/types.ts — Add initPrompt?: string to WorkflowStage interface`
- `packages/core/src/workflow/templates.ts — Add initPrompt to WorkflowTemplateStage and YAML parsing logic`

---

## File Scope

- `packages/core/src/workflow/types.ts`
- `packages/core/src/workflow/templates.ts`

---

## Acceptance Criteria

- [ ] WorkflowStage interface has initPrompt?: string field with JSDoc comment
- [ ] WorkflowTemplateStage interface (or equivalent) has initPrompt?: string field
- [ ] YAML parser in templates.ts correctly parses initPrompt from stage definitions
- [ ] initPrompt is preserved when creating workflow stages from templates
- [ ] Unit tests verify initPrompt is parsed and preserved
- [ ] pnpm build passes
- [ ] pnpm --filter @choragen/core test passes

---

## Notes

Reference the CR implementation notes for the expected schema:

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

The YAML parsing in `templates.ts` uses a custom line-by-line parser. Add handling for `initPrompt:` similar to how other string fields are parsed.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
