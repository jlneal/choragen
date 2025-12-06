# Scenario: Implementation Agent Workflow

**Domain**: core  
**Created**: 2025-12-05  

---

## User Story

As an **implementation agent**, I want to receive a well-defined task with clear context and acceptance criteria, so that I can complete the work without needing the full project history.

---

## Flow

1. **Receive Task**: Get task assignment from control agent
2. **Read Context**: Review task file for:
   - Objective
   - Expected files
   - Acceptance criteria
   - Constraints
3. **Check Governance**: `choragen governance:check create file1.ts file2.ts`
4. **Implement**: Make the required changes
5. **Verify**: Run tests, linting, type checking
6. **Report Completion**: Provide summary to control agent
7. **Await Review**: Control agent reviews and approves/reworks

---

## Task Context

Implementation agents receive fresh context per task. The task file contains everything needed:

```markdown
# Task: Set up profile API routes

**Chain**: CHAIN-001-profile-backend  
**Task**: 001-api-routes  

---

## Objective

Create the API routes for user profile CRUD operations.

---

## Expected Files

- `app/api/profile/route.ts`
- `app/api/profile/[id]/route.ts`
- `lib/profile/types.ts`

---

## Acceptance Criteria

- [ ] GET /api/profile returns current user profile
- [ ] PATCH /api/profile updates profile fields
- [ ] All routes require authentication
- [ ] Input validation with Zod schemas

---

## Constraints

- Use existing auth middleware
- Follow API patterns from other routes
```

---

## Acceptance Criteria

- [ ] Task file contains all needed context
- [ ] Governance check prevents forbidden mutations
- [ ] Implementation can proceed without chain history
- [ ] Completion report captures what was done

---

## Linked Personas

- [AI Agent](../personas/ai-agent.md) (as Implementation Agent)
- [Solo Developer](../personas/solo-developer.md)
- [Open Source Maintainer](../personas/open-source-maintainer.md)

---

## Linked Use Cases

- [Create and Execute Task Chain](../use-cases/create-execute-task-chain.md)
- [Debug Failed Task](../use-cases/debug-failed-task.md)

---

## Linked Features

- [Task Chain Management](../features/task-chain-management.md)
- [Governance Enforcement](../features/governance-enforcement.md)
