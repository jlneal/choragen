# Change Request: Fix Request Reflection System

**ID**: CR-20251213-001  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-13  
**Owner**: agent  

---

## What

Add a mandatory **reflection stage** to fix request workflows that captures learnings and generates actionable improvement suggestions. The system includes:

- **Reflection section** in FR template with structured prompts
- **Reflection stage** in fix-related workflow templates
- **Feedback suggestions** as a new artifact type (distinct from agent feedback)
- **Suggestion categories**: lint rules, workflow changes, environment changes, documentation, testing, commit hooks, workflow hooks
- **Human review workflow** for promoting suggestions to Change Requests

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
- Create `feedback-suggestion.md` template for improvement suggestions
- Add `reflection` stage type to workflow system
- Create `SuggestionManager` for CRUD on suggestions
- Add suggestion persistence in `.choragen/suggestions/`
- Create `choragen suggestion:list` and `choragen suggestion:promote` CLI commands
- Add web UI for reviewing and promoting suggestions
- Define suggestion categories with structured metadata

**Out of Scope**:
- Automatic suggestion generation (AI analysis of patterns across FRs)
- Suggestion deduplication/merging
- Priority scoring of suggestions
- Integration with external issue trackers

---

## Affected Design Documents

- docs/design/core/features/workflow-orchestration.md
- docs/design/core/features/agent-feedback.md (related but distinct)
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
3. Generate suggestions that humans review asynchronously

---

## Completion Notes

[Added when moved to done/]
