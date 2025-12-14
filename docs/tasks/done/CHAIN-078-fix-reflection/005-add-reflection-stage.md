# Task: Add Reflection Stage to Workflow System

**Chain**: CHAIN-078-fix-reflection  
**Task**: 005  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Add `reflection` stage type to the workflow system that creates feedback items with improvement suggestions after fix request completion.

---

## Context

CR-20251213-001 specifies a reflection stage that captures learnings from fix requests. The stage creates `FeedbackItem` entries with `type: "idea"`, `source: "reflection"`, and appropriate `category` for human review.

---

## Expected Files

- `packages/core/src/workflow/types.ts` (modify - add reflection stage type)
- `packages/core/src/workflow/stage-handlers.ts` (modify or create - add reflection handler)
- `templates/workflow-templates/hotfix.yaml` (modify - add reflection stage)
- `templates/workflow-templates/standard.yaml` (modify - add reflection stage)
- `packages/core/src/workflow/__tests__/reflection-stage.test.ts`

---

## Acceptance Criteria

- [ ] `reflection` added as valid stage type in workflow system
- [ ] Reflection stage handler creates `FeedbackItem` with `type: "idea"`, `source: "reflection"`
- [ ] Reflection stage uses structured prompts from FR template
- [ ] Hotfix workflow template includes reflection stage after completion
- [ ] Standard workflow template includes reflection stage after completion
- [ ] Reflection stage is non-blocking (workflow can complete without human review)
- [ ] Unit tests cover reflection stage behavior

---

## Constraints

- Follow existing workflow stage patterns
- Reflection stage should be optional/skippable
- Must integrate with existing FeedbackManager

---

## Notes

Reflection stage flow:
1. Agent completes fix implementation
2. Workflow transitions to reflection stage
3. Agent answers structured prompts (why, escape analysis, prevention)
4. Agent creates FeedbackItem(s) with improvement suggestions
5. Workflow completes; feedback items await human review asynchronously

Stage init prompt should guide agent to:
- Analyze root cause
- Identify escape points
- Suggest preventive measures
- Categorize suggestions appropriately

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
