# Task: Add feedback:promote CLI Command

**Chain**: CHAIN-078-fix-reflection  
**Task**: 004  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Implement `choragen feedback:promote` CLI command to promote a feedback item to a Change Request.

---

## Context

CR-20251213-001 specifies a CLI command for promoting reflection-generated feedback to CRs. This enables the human review workflow where improvement suggestions are reviewed and promoted to actionable change requests.

---

## Expected Files

- `packages/cli/src/commands/feedback/promote.ts`
- `packages/cli/src/commands/feedback/index.ts` (update if exists, create if not)
- `packages/cli/__tests__/commands/feedback/promote.test.ts`

---

## Acceptance Criteria

- [ ] `feedback:promote` command takes feedback ID as argument
- [ ] Command creates a new CR in `docs/requests/change-requests/todo/`
- [ ] CR is pre-filled with feedback description, rationale, and category
- [ ] Feedback item is updated with `status: "resolved"` and `promotedTo: <CR-ID>`
- [ ] Command outputs the created CR path
- [ ] Proper error handling for non-existent feedback ID
- [ ] Proper error handling for already-promoted feedback
- [ ] Unit tests cover command functionality

---

## Constraints

- Follow existing CLI command patterns
- Use `FeedbackManager` from `@choragen/core`
- Use CR template for generating the change request

---

## Notes

Example usage:
```bash
# Promote a feedback item to CR
choragen feedback:promote FB-001 --workflow WF-20251214-001

# Output:
# Created CR-20251214-002 from feedback FB-001
# Path: docs/requests/change-requests/todo/CR-20251214-002-add-lint-rule.md
```

The command should:
1. Load the feedback item by ID
2. Generate a CR ID
3. Create CR file from template with pre-filled fields
4. Update feedback item with promotedTo reference
5. Print success message

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
