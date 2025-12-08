# Use Case: Review and Approve Work

**Domain**: core  
**Created**: 2025-12-06  

---

## User Goal

As a control agent or team lead, I want to review and approve completed work so that I can ensure quality standards are met before tasks are marked done.

---

## Actor

- **Primary**: [AI Agent](../personas/ai-agent.md) (as Control Agent), [Team Lead](../personas/team-lead.md)
- **Secondary**: [Open Source Maintainer](../personas/open-source-maintainer.md)

---

## Preconditions

- A task chain exists with tasks in `in-review` status
- Implementation agent has completed work and reported completion
- Reviewer has access to the task file and changed files

---

## Main Flow

1. **Identify tasks awaiting review**
   ```bash
   choragen task:list CHAIN-xxx --status in-review
   # Output: 
   # in-review:
   #   - 002-models: Implement user models
   ```

2. **Read the task file**
   ```bash
   cat docs/tasks/in-review/CHAIN-xxx/002-models.md
   ```
   - Review acceptance criteria
   - Note verification commands
   - Understand expected deliverables

3. **Review the implementation**
   - Check changed files match task scope
   - Verify code follows project conventions
   - Ensure tests are included (if required)
   - Run verification commands from task file

4. **Run verification commands**
   ```bash
   pnpm build
   pnpm test
   pnpm typecheck
   ```

5. **Check governance compliance**
   ```bash
   choragen governance:check modify src/models/user.ts
   # Output: ✓ Allowed: src/models/user.ts (domain: core)
   ```

6. **Make approval decision**

   **If approved:**
   ```bash
   choragen task:approve CHAIN-xxx 002-models
   ```
   - Task moves to `done/`
   - Impl agent notified of approval

   **If needs rework:**
   ```bash
   choragen task:rework CHAIN-xxx 002-models
   ```
   - Task moves back to `in-progress`
   - Add rework notes to task file

---

## Alternative Flows

### A1: Partial approval with follow-up

Work is acceptable but needs minor improvements:
1. Approve the current task
2. Create a new task for improvements
   ```bash
   choragen task:add CHAIN-xxx 002a-models-cleanup "Clean up user models"
   ```
3. Add the new task to backlog for later

### A2: Batch review

Multiple tasks completed simultaneously:
1. List all in-review tasks
2. Review each task independently
3. Approve/rework each based on its criteria
4. Provide consolidated feedback if from same impl agent

### A3: Escalation required

Reviewer cannot make decision alone:
1. Add comment to task file noting escalation
2. Tag task with escalation marker
3. Notify appropriate stakeholder
4. Wait for guidance before approve/rework

### A4: Governance violation discovered

Impl agent modified files outside scope:
1. Run `choragen governance:check` on all changed files
2. Document violations in task file
3. Send task back for rework with specific instructions
4. Consider updating governance rules if scope was too narrow

---

## Postconditions

**On Approval:**
- Task file moved to `done/CHAIN-xxx/`
- Task status updated to `done`
- Chain progress updated
- Work is ready for integration

**On Rework:**
- Task file moved back to `in-progress/CHAIN-xxx/`
- Task status updated to `in-progress`
- Rework notes added to task file
- Impl agent can see feedback and continue

---

## Review Checklist

Use this checklist when reviewing:

- [ ] **Scope**: Changes match task description
- [ ] **Acceptance Criteria**: All criteria met
- [ ] **Tests**: Tests added/updated as needed
- [ ] **Governance**: No unauthorized file modifications
- [ ] **Build**: Project builds successfully
- [ ] **Types**: Type checking passes
- [ ] **Style**: Code follows project conventions
- [ ] **Documentation**: Relevant docs updated

---

## Error Conditions

| Error | Cause | Resolution |
|-------|-------|------------|
| "Task not in review" | Wrong status | Check `task:list` for current status |
| "Chain not found" | Invalid chain ID | Verify chain exists |
| "Verification failed" | Tests/build broken | Send back for rework |

---

## Related Features

- [Task Chain Management](../features/task-chain-management.md)
- [Governance Enforcement](../features/governance-enforcement.md)

---

## Acceptance Criteria

- [ ] Tasks in review status can be listed
- [ ] Task acceptance criteria are visible for review
- [ ] Verification commands can be run
- [ ] Tasks can be approved (moves to done)
- [ ] Tasks can be sent back for rework (moves to in-progress)

---

## Related Scenarios

- [Control Agent Workflow](../scenarios/control-agent-workflow.md)
