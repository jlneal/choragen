# Task: Create Feedback Suggestion Template

**Chain**: CHAIN-078-fix-reflection  
**Task**: 002  
**Status**: superseded  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Create a new `feedback-suggestion.md` template for improvement suggestions generated from fix request reflections.

---

## Context

CR-20251213-001 defines feedback suggestions as a distinct artifact type from agent feedback. These suggestions capture actionable improvements identified during FR reflection and are stored for human review and potential promotion to Change Requests.

---

## Expected Files

- `templates/feedback-suggestion.md`
- `templates/AGENTS.md` (update Available Templates table)

---

## Acceptance Criteria

- [ ] `templates/feedback-suggestion.md` created with proper structure
- [ ] Template includes ID field with format `SUG-YYYYMMDD-NNN`
- [ ] Template includes category field (lint, workflow, environment, documentation, testing, commit-hook, workflow-hook)
- [ ] Template includes source FR reference field
- [ ] Template includes description and rationale sections
- [ ] Template includes status field (pending, promoted, dismissed)
- [ ] `templates/AGENTS.md` updated with new template entry

---

## Constraints

- Must follow existing template conventions
- Categories must match those defined in CR-20251213-001

---

## Notes

Suggestion categories from CR:
| Category | Examples |
|----------|----------|
| `lint` | Add ESLint rule, TypeScript strict option |
| `workflow` | Add validation stage, require review |
| `environment` | Pin dependency, add CI check |
| `documentation` | Clarify API contract, add example |
| `testing` | Add regression test, increase coverage |
| `commit-hook` | Add pre-commit validation |
| `workflow-hook` | Add gate before merge |

---

## Superseded Notes

Design review (2025-12-14) determined that feedback suggestions should be merged into the existing `FeedbackItem` system rather than creating a separate artifact type. The `feedback-suggestion.md` template was deleted. Reflection-generated improvements now use `FeedbackItem` with `type: "idea"`, `source: "reflection"`.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
