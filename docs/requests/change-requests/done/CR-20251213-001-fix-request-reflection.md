# Change Request: Fix Request Reflection System

**ID**: CR-20251213-001  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-13  
**Owner**: agent  
**Chain**: CHAIN-078-fix-reflection  

---

## What

Add a mandatory **reflection stage** to fix request workflows that captures learnings and generates actionable improvement suggestions. The system includes:

- **Reflection section** in FR template with structured prompts
- **Reflection stage** in fix-related workflow templates
- **Extended FeedbackItem** with `source`, `category`, and `promotedTo` fields for reflection-generated feedback
- **Improvement categories**: lint rules, workflow changes, environment changes, documentation, testing, commit hooks, workflow hooks
- **Human review workflow** for promoting feedback items to Change Requests

---

## Why

Fix requests address symptoms, but the underlying causes often indicate systemic issues:

1. **Lost learnings** — Fixes complete without capturing why the bug occurred
2. **Repeated mistakes** — Same class of bugs recur because prevention wasn't considered
3. **No improvement flywheel** — Fixes don't feed back into process improvements
4. **Manual pattern recognition** — Humans must notice patterns across many FRs

A reflection system creates a **continuous improvement loop**: bugs → fixes → reflections → suggestions → CRs → prevention.

---

## Scope

**In Scope**:
- Add `## Reflection` section to `fix-request.md` template with structured prompts:
  - Why did this bug occur?
  - What allowed it to reach this stage?
  - How could it have been prevented or caught earlier?
- Extend `FeedbackItem` in `packages/core/src/feedback/types.ts` with:
  - `source?: "agent" | "reflection" | "audit"` — origin of the feedback
  - `category?: FeedbackCategory` — improvement category (lint, workflow, etc.)
  - `promotedTo?: string` — CR ID if promoted to change request
- Add `reflection` stage type to workflow system
- Update `FeedbackManager` to support filtering by source/category
- Add `choragen feedback:promote` CLI command to promote feedback to CR
- Define improvement categories with structured metadata

**Revised Approach** (design review 2025-12-14):
- Reflection stage creates `FeedbackItem` with `type: "idea"`, `source: "reflection"`
- Existing `FeedbackManager` handles persistence (no separate SuggestionManager)
- Existing feedback UI/CLI handles review with category filtering

**Out of Scope**:
- Automatic suggestion generation (AI analysis of patterns across FRs)
- Suggestion deduplication/merging
- Priority scoring of suggestions
- Integration with external issue trackers

---

## Affected Design Documents

- docs/design/core/features/workflow-orchestration.md
- docs/design/core/features/agent-feedback.md (extended with source/category/promotedTo)
- NEW: docs/design/core/features/fix-reflection.md

---

## Linked ADRs

- ADR-011: Workflow Orchestration
- ADR-TBD: Fix Reflection System

---

## Commits

No commits yet.

---

## Implementation Notes

### Reflection Section (FR Template)

```markdown
## Reflection

**Why did this occur?**
{{REFLECTION_WHY}}

**What allowed it to reach this stage?**
{{REFLECTION_ESCAPE}}

**How could it be prevented?**
{{REFLECTION_PREVENTION}}

**Suggested improvements**:
- Category: {{SUGGESTION_CATEGORY}}
- Description: {{SUGGESTION_DESCRIPTION}}
```

### Suggestion Categories

| Category | Examples |
|----------|----------|
| `lint` | Add ESLint rule, TypeScript strict option |
| `workflow` | Add validation stage, require review |
| `environment` | Pin dependency, add CI check |
| `documentation` | Clarify API contract, add example |
| `testing` | Add regression test, increase coverage |
| `commit-hook` | Add pre-commit validation |
| `workflow-hook` | Add gate before merge |

### Workflow Integration

The `reflection` stage would:
1. Be added to hotfix and standard workflows after completion
2. Use a stage init prompt (see CR-20251213-002) to guide the agent
3. Create `FeedbackItem` with `type: "idea"`, `source: "reflection"`, and appropriate `category`
4. Humans review via existing feedback UI/CLI with category filtering
5. `feedback:promote` command creates CR from feedback item

---

## Completion Notes

**Completed**: 2025-12-14

### Implementation Summary

All acceptance criteria met via CHAIN-078-fix-reflection:

1. **FR Template** — Reflection section added with structured prompts (why/escape/prevention)
2. **FeedbackItem Extended** — Added `source`, `category`, `promotedTo` fields
3. **FeedbackManager** — Supports filtering by source and category
4. **Reflection Stage** — Added to workflow system with auto gate (non-blocking)
5. **Workflow Templates** — Standard and hotfix templates include reflection stage
6. **CLI Command** — `feedback:promote` creates CRs from feedback items
7. **Design Document** — Created `docs/design/core/features/fix-reflection.md`

### Design Pivot (2025-12-14)

Original design created a separate `SuggestionManager`. Design review identified redundancy with existing `FeedbackItem` system. Merged suggestion concept into feedback by extending `FeedbackItem` with metadata fields instead.

### Files Changed

- `packages/core/src/feedback/types.ts` — FeedbackCategory, FeedbackSource, extended FeedbackItem
- `packages/core/src/feedback/schemas.ts` — Zod schemas for new fields
- `packages/core/src/feedback/FeedbackManager.ts` — Source/category filtering
- `packages/core/src/workflow/types.ts` — Added reflection stage type
- `packages/core/src/workflow/stage-handlers.ts` — Reflection stage handler
- `packages/core/src/workflow/stage-tools.ts` — Tool permissions for reflection
- `packages/core/src/workflow/templates.ts` — Built-in templates with reflection
- `packages/cli/src/commands/feedback/promote.ts` — CLI command
- `templates/fix-request.md` — Reflection section
- `templates/workflow-templates/standard.yaml` — Reflection stage
- `templates/workflow-templates/hotfix.yaml` — Reflection stage
- `docs/design/core/features/fix-reflection.md` — Design document
