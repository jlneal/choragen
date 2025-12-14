# Task: Create Audit Chain Template

**Chain**: CHAIN-074-commit-audit  
**Task**: 004  
**Status**: todo  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Create a workflow template for the audit chain that defines the 9-task structure for commit audits.

---

## Context

The audit chain is a specialized chain with 9 tasks:

| Task | Type | Focus |
|------|------|-------|
| 1 | `security-audit` | Security vulnerabilities, secrets, permissions |
| 2 | `architecture-audit` | Design patterns, coupling, dependencies |
| 3 | `standards-audit` | Naming, structure, conventions |
| 4 | `documentation-audit` | Comments, README, API docs, design doc refs |
| 5 | `testing-audit` | Test coverage, test quality, edge cases |
| 6 | `traceability-audit` | CR/FR refs, scope compliance, commit format |
| 7 | `performance-audit` | Obvious inefficiencies, resource usage |
| 8 | `review` | Cross-cutting concerns, overall assessment |
| 9 | `feedback-compilation` | Compile all findings into feedback items |

Reference: `@/Users/justin/Projects/choragen/docs/requests/change-requests/doing/CR-20251213-003-commit-audit.md:98-110`

---

## Expected Files

- `templates/workflow-templates/audit.yaml` (new)

---

## Acceptance Criteria

- [ ] Audit workflow template created with 9 stages
- [ ] Each stage has appropriate role assignment
- [ ] Stages 1-8 store findings in chain context (not feedback)
- [ ] Stage 9 (feedback-compilation) creates actual feedback items
- [ ] Template includes checklists for each audit type
- [ ] Template is valid YAML matching existing template schema
- [ ] Template includes metadata (name, displayName, description)

---

## Constraints

- Follow existing workflow template patterns in `templates/workflow-templates/`
- Audit tasks run sequentially (findings accumulate in context)

---

## Notes

Each audit task should have access to:
- Commit SHA
- Commit message
- List of changed files
- Diff content (if available)
- Previous audit findings (accumulated in chain context)

The checklists from the CR should be embedded in the template as guidance for each audit stage.
