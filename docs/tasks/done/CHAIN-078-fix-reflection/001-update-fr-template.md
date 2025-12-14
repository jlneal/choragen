# Task: Update Fix Request Template with Reflection Section

**Chain**: CHAIN-078-fix-reflection  
**Task**: 001  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Add a mandatory `## Reflection` section to the fix request template (`templates/fix-request.md`) with structured prompts for capturing learnings.

---

## Context

CR-20251213-001 introduces a reflection system for fix requests. The first step is updating the FR template to include reflection prompts that guide agents to analyze root causes and suggest improvements.

The reflection section should appear after `## Verification` and before `## Completion Notes`.

---

## Expected Files

- `templates/fix-request.md`

---

## Acceptance Criteria

- [ ] `## Reflection` section added to `templates/fix-request.md`
- [ ] Section includes "Why did this occur?" prompt with `{{REFLECTION_WHY}}` placeholder
- [ ] Section includes "What allowed it to reach this stage?" prompt with `{{REFLECTION_ESCAPE}}` placeholder
- [ ] Section includes "How could it be prevented?" prompt with `{{REFLECTION_PREVENTION}}` placeholder
- [ ] Section includes "Suggested improvements" subsection with category and description placeholders
- [ ] Template follows existing style conventions

---

## Constraints

- Must not break existing FR documents (additive change only)
- Must use `{{VARIABLE}}` placeholder syntax consistent with other templates

---

## Notes

Reference the CR implementation notes for the exact structure:

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

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
