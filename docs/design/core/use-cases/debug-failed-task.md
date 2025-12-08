# Use Case: Debug Failed Task

**Domain**: core  
**Created**: 2025-12-06  

---

## User Goal

As a control agent or developer, I want to debug a failed task so that I can identify the root cause and either fix the issue or update the task definition.

---

## Actor

- **Primary**: [AI Agent](../personas/ai-agent.md) (as Control Agent), [Solo Developer](../personas/solo-developer.md)
- **Secondary**: [Team Lead](../personas/team-lead.md)

---

## Preconditions

- A task exists that has failed or been sent back for rework multiple times
- The failure reason is not immediately obvious
- Actor needs to understand why the task is failing

---

## Main Flow

1. **Identify the problematic task**
   ```bash
   choragen chain:status CHAIN-xxx
   # Look for tasks with multiple rework cycles or blocked status
   ```

2. **Read the task file history**
   ```bash
   cat docs/tasks/in-progress/CHAIN-xxx/003-routes.md
   ```
   - Review original acceptance criteria
   - Check rework notes from previous attempts
   - Identify patterns in failures

3. **Review git history for the task**
   ```bash
   git log --oneline -- docs/tasks/*/CHAIN-xxx/003-routes.md
   git log --oneline -- src/routes/auth.ts  # files the task modifies
   ```

4. **Check for common failure causes**

   **Unclear acceptance criteria:**
   - Criteria too vague or ambiguous
   - Missing edge cases
   - Conflicting requirements

   **Context limitations:**
   - Task too large for single context window
   - Missing background information
   - Dependencies not documented

   **Technical blockers:**
   - Build failures
   - Test failures
   - Type errors
   - Governance violations

5. **Run diagnostics**
   ```bash
   # Check build status
   pnpm build 2>&1 | head -50
   
   # Check test failures
   pnpm test -- --reporter=verbose 2>&1 | tail -100
   
   # Check type errors
   pnpm typecheck 2>&1
   
   # Check governance
   choragen governance:check modify src/routes/auth.ts
   ```

6. **Analyze the root cause**
   - Compare expected vs actual output
   - Identify the gap between criteria and implementation
   - Determine if issue is with task definition or execution

7. **Apply corrective action**

   **If task definition is the problem:**
   - Rewrite acceptance criteria with more specificity
   - Break task into smaller subtasks
   - Add missing context to task file

   **If execution is the problem:**
   - Add debugging hints to task file
   - Include specific code examples
   - Reference similar completed tasks

   **If blocked by external factor:**
   ```bash
   choragen task:block CHAIN-xxx 003-routes
   ```
   - Document blocking reason
   - Create dependency task if needed

8. **Retry the task**
   - Update task file with learnings
   - Assign to impl agent with additional context
   - Monitor more closely on next attempt

---

## Alternative Flows

### A1: Task is fundamentally impossible

The task cannot be completed as specified:
1. Document why task is impossible
2. Close the task with explanation
3. Create alternative task(s) that achieve the goal differently
4. Update the CR with revised approach

### A2: Task reveals architectural issue

Failure exposes a deeper problem:
1. Create a Fix Request (FR) for the underlying issue
2. Block the current task on the FR
3. Create a new chain for the architectural fix
4. Resume original task after fix is complete

### A3: Human intervention required

AI agents cannot resolve the issue:
1. Escalate to human developer
2. Add detailed notes about what was tried
3. Human debugs and either:
   - Fixes the issue directly
   - Provides guidance for AI to retry
4. Document resolution for future reference

### A4: Environment-specific failure

Task fails due to environment differences:
1. Document environment requirements in task file
2. Add setup steps to preconditions
3. Verify environment before retry
4. Consider adding environment checks to CI

---

## Postconditions

- Root cause of failure is identified and documented
- Task file is updated with learnings
- Either:
  - Task is successfully completed on retry
  - Task is blocked with clear dependency
  - Task is closed with explanation
  - Alternative approach is documented

---

## Debugging Checklist

Use this checklist when debugging:

- [ ] **Read all rework notes** from previous attempts
- [ ] **Check git history** for related changes
- [ ] **Run build** and capture full output
- [ ] **Run tests** and identify specific failures
- [ ] **Check types** for type errors
- [ ] **Verify governance** compliance
- [ ] **Review dependencies** - are all required files present?
- [ ] **Check context** - does task file have enough information?
- [ ] **Validate criteria** - are acceptance criteria achievable?

---

## Common Failure Patterns

| Pattern | Symptoms | Resolution |
|---------|----------|------------|
| Context overflow | Impl agent misses requirements | Break into smaller tasks |
| Vague criteria | Different interpretations each attempt | Add specific examples |
| Missing dependency | Import errors, undefined references | Add prerequisite task |
| Governance block | "Not allowed" errors | Update governance or task scope |
| Test brittleness | Tests pass locally, fail in CI | Add environment setup |
| Circular dependency | Tasks block each other | Restructure task chain |

---

## Related Features

- [Task Chain Management](../features/task-chain-management.md)
- [Governance Enforcement](../features/governance-enforcement.md)

---

## Acceptance Criteria

- [ ] Failed tasks can be identified via chain status
- [ ] Task history and rework notes are accessible
- [ ] Diagnostic commands help identify root cause
- [ ] Tasks can be updated with learnings
- [ ] Tasks can be retried or blocked as appropriate

---

## Related Scenarios

- [Control Agent Workflow](../scenarios/control-agent-workflow.md)
- [Implementation Agent Workflow](../scenarios/implementation-agent-workflow.md)
