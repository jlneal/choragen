# Feature: Fix Reflection System

**Domain**: core  
**Status**: draft  
**Created**: 2025-12-14  

---

## Overview

The fix reflection system captures structured learnings after a fix request completes. It guides agents to analyze root causes, escape paths, and preventive measures, creates reflection feedback items with categorized improvement ideas, and enables promotion of those ideas into follow-on change requests.

---

## Problem

- Fix requests close without extracting lessons that prevent recurrence.  
- Improvement ideas get lost in chat or commit messages.  
- No consistent way to categorize or follow up on post-fix suggestions.  
- Humans must hunt for learnings across workflows and tasks.

---

## Solution

1) **FR template reflection prompts** collect why/escape/prevention data while the fix is fresh.  
2) **Reflection workflow stage** (non-blocking, auto gate) runs after completion, generating feedback items with `type: "idea"` and `source: "reflection"`.  
3) **Categorized feedback** adds `category` metadata for routing (lint, workflow, environment, documentation, testing, commit-hook, workflow-hook).  
4) **Promotion flow** lets agents convert reflection feedback into a new CR via `choragen feedback:promote`, linking the new work back to the original feedback (`promotedTo`).  
5) Feedback remains asynchronous and non-blocking; workflows complete while improvement suggestions await review.

---

## Data Model

The feedback model is extended to support reflection learnings:

```typescript
type FeedbackSource = "agent" | "reflection" | "audit";

type FeedbackCategory =
  | "lint"
  | "workflow"
  | "environment"
  | "documentation"
  | "testing"
  | "commit-hook"
  | "workflow-hook";

interface FeedbackItem {
  // existing fields …
  source?: FeedbackSource;      // reflection marks items as reflection
  category?: FeedbackCategory;  // improvement routing
  promotedTo?: string;          // CR ID when promoted
}
```

Reflection-created items:
- `type`: `"idea"`  
- `source`: `"reflection"`  
- `category`: one of the categories above (defaulted to `workflow` by the handler)  
- `status`: `"pending"` (non-blocking)  

---

## Workflow Integration

- **Stage type**: `reflection` (added to `StageType` and tool matrix).  
- **Gate**: `auto` (non-blocking; workflow can finish without human review).  
- **Handler**: `stage-handlers` creates a reflection feedback item on stage entry, idempotently per stage.  
- **Placement**: appended after completion in both **standard** and **hotfix** templates (builtin and repository YAML).  
- **Prompting**: `REFLECTION_INIT_PROMPT` guides agents to root cause, escape analysis, prevention, and categorization using `FEEDBACK_CATEGORIES`.

---

## Fix Request Template Reflection Section

`templates/fix-request.md` includes a **Reflection** section with structured prompts:
- Why did this occur?  
- What allowed it to reach this stage?  
- How could it be prevented?  
- Suggested improvements (category + description)  

These responses seed the reflection stage and resulting feedback items.

---

## CLI Command: feedback:promote

`choragen feedback:promote <feedback-id> --workflow <workflow-id>`:
- Creates a new Change Request in `docs/requests/change-requests/todo/` using the change-request template.
- Prefills description/motivation from the feedback content and metadata.
- Resolves the feedback item and sets `promotedTo` to the new CR ID.
- Outputs the created CR path for traceability.

---

## Improvement Categories (examples)

- **lint**: Add lint rule for unused imports to fail CI early.  
- **workflow**: Require design review checklist before implementation.  
- **environment**: Add staging parity check for feature flags.  
- **documentation**: Update runbook with rollback steps for the service.  
- **testing**: Add regression test covering the escape scenario.  
- **commit-hook**: Enforce commit hook to verify request ID references.  
- **workflow-hook**: Add workflow hook to trigger targeted audit after FR closure.

---

## Acceptance Criteria

- Reflection stage added as a valid stage type and non-blocking.  
- Reflection stage creates `idea` feedback with `source: "reflection"` and categorized suggestions.  
- FeedbackItem extended with `source`, `category`, `promotedTo`.  
- FR template documents reflection prompts.  
- `feedback:promote` CLI creates CRs from reflection feedback and links via `promotedTo`.  
- Improvement categories documented with examples.

---

## Linked Artifacts

- **CR**: [CR-20251213-001](../../../requests/change-requests/doing/CR-20251213-001-fix-request-reflection.md)  
- **Design**: [agent-feedback.md](./agent-feedback.md), [workflow-orchestration.md](./workflow-orchestration.md)  
- **Source References**:
  - `packages/core/src/feedback/types.ts`
  - `packages/core/src/workflow/stage-handlers.ts`
  - `packages/core/src/workflow/templates.ts`
  - `packages/cli/src/commands/feedback/promote.ts`

---

## Open Questions

- Should reflection feedback default category vary by FR severity or component ownership?  
- Do we need automated promotion rules (e.g., auto-CR for critical testing gaps)?
