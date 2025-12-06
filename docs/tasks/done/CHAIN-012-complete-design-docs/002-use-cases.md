# Task: Create Use Case Documents

**Chain**: CHAIN-012-complete-design-docs  
**Task**: 002-use-cases  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Create use case documents for the 5 key workflows in `docs/design/core/use-cases/`.

---

## Expected Files

Create:
- `docs/design/core/use-cases/bootstrap-new-project.md`
- `docs/design/core/use-cases/create-execute-task-chain.md`
- `docs/design/core/use-cases/review-approve-work.md`
- `docs/design/core/use-cases/debug-failed-task.md`
- `docs/design/core/use-cases/onboard-new-contributor.md`

---

## Use Case Template

Each use case should include:
- **Title**: Action-oriented name
- **Actor**: Which persona(s) perform this
- **Preconditions**: What must be true before starting
- **Main Flow**: Step-by-step happy path
- **Alternative Flows**: Variations and edge cases
- **Postconditions**: What is true after completion
- **Related Features**: Links to feature docs

---

## Acceptance Criteria

- [ ] 5 use case documents created
- [ ] Each follows consistent template structure
- [ ] Main flows are detailed and actionable
- [ ] Cross-references to personas and features

---

## Notes

Reference the CR for proposed use cases:
1. Bootstrap New Project - Initialize choragen in a new repo
2. Create and Execute Task Chain - Full CR → chain → tasks → done flow
3. Review and Approve Work - Control agent reviewing impl agent output
4. Debug Failed Task - Understanding why a task failed
5. Onboard New Contributor - Getting someone up to speed
