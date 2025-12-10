# Change Request: Example Consumer Project

**ID**: CR-20251206-010  
**Domain**: docs  
**Status**: todo  
**Created**: 2025-12-06  
**Owner**: agent  

---

## What

Create an example project demonstrating how to use Choragen in a real codebase. This serves as both documentation and integration testing.

---

## Why

1. **Onboarding** — New users need a working example to understand the workflow
2. **Integration testing** — Validates that packages work together correctly
3. **Documentation** — Shows patterns in context, not just snippets
4. **Dogfooding validation** — Proves the framework works outside its own repo

---

## Scope

**In Scope**:
- Simple Next.js or Express app as the example
- Initialize with `choragen init`
- Create a sample CR and task chain
- Demonstrate governance rules
- Show DesignContract usage on API routes
- Include ESLint plugin configuration
- README with walkthrough

**Out of Scope**:
- Complex application logic
- Database integration
- Authentication
- Deployment configuration

---

## Affected Design Documents

- [docs/design/core/features/agent-workflow.md](../../../design/core/features/agent-workflow.md)
- [docs/design/core/features/cli-commands.md](../../../design/core/features/cli-commands.md)

---

## Linked ADRs

- ADR-001-task-file-format
- ADR-002-governance-schema

---

## Commits

No commits yet.

---

## Implementation Notes

Location options:
1. `examples/` directory in monorepo
2. Separate repository (linked from README)

Recommended: `examples/todo-app/` in monorepo for easier maintenance.

Example should demonstrate:
1. `choragen init` output
2. Creating a CR for "add todo endpoint"
3. Creating a task chain
4. Governance rules for the project
5. DesignContract on the API route
6. ESLint catching violations
7. Completing the workflow

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
