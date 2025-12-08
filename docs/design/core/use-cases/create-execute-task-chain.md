# Use Case: Create and Execute Task Chain

**Domain**: core  
**Created**: 2025-12-06  

---

## User Goal

As a control agent, I want to create and execute a task chain so that I can coordinate work on a change request through structured, traceable tasks.

---

## Actor

- **Primary**: [AI Agent](../personas/ai-agent.md) (as Control Agent)
- **Secondary**: [Solo Developer](../personas/solo-developer.md), [Team Lead](../personas/team-lead.md)

---

## Preconditions

- Choragen is initialized in the project
- A CR or FR exists documenting the work to be done
- Actor has permission to create chains and tasks

---

## Main Flow

1. **Receive or create a Change Request**
   ```markdown
   # docs/requests/change-requests/todo/CR-20251206-001-add-auth.md
   
   # Change Request: Add Authentication
   **ID**: CR-20251206-001
   **Status**: todo
   ```

2. **Create a task chain from the CR**
   ```bash
   choragen chain:new CR-20251206-001 add-auth "Add Authentication"
   # Output: Created chain CHAIN-001-add-auth
   ```

3. **Break down work into tasks**
   ```bash
   choragen task:add CHAIN-001-add-auth 001-schema "Design auth schema"
   choragen task:add CHAIN-001-add-auth 002-models "Implement user models"
   choragen task:add CHAIN-001-add-auth 003-routes "Add auth routes"
   choragen task:add CHAIN-001-add-auth 004-tests "Write auth tests"
   ```

4. **Acquire file locks for the chain**
   ```bash
   choragen lock:acquire CHAIN-001-add-auth "src/auth/**" "src/models/user.*"
   ```

5. **Move first task to ready**
   ```bash
   choragen task:ready CHAIN-001-add-auth 001-schema
   ```

6. **Start the task**
   ```bash
   choragen task:start CHAIN-001-add-auth 001-schema
   ```

7. **Execute task (or delegate to impl agent)**
   - Read task file for full context
   - Implement according to acceptance criteria
   - Run verification commands

8. **Complete the task**
   ```bash
   choragen task:complete CHAIN-001-add-auth 001-schema
   ```

9. **Review and approve**
   ```bash
   choragen task:approve CHAIN-001-add-auth 001-schema
   ```

10. **Continue with next task**
    ```bash
    choragen task:next CHAIN-001-add-auth
    # Output: Next task: 002-models
    ```

11. **Repeat steps 5-10 for remaining tasks**

12. **Release locks when chain completes**
    ```bash
    choragen lock:release CHAIN-001-add-auth
    ```

13. **Move CR to done**
    - Add completion notes to CR
    - Move CR file to `done/`

---

## Alternative Flows

### A1: Task needs rework

After review, task doesn't meet criteria:
1. Control agent runs `choragen task:rework CHAIN-xxx task-id`
2. Task moves back to `in-progress`
3. Impl agent receives rework feedback
4. Impl agent fixes issues
5. Resume from step 8

### A2: Task is blocked

Task cannot proceed due to external dependency:
1. Run `choragen task:block CHAIN-xxx task-id`
2. Task moves to `blocked/`
3. Add blocking reason to task file
4. Continue with other tasks if possible
5. When unblocked, run `choragen task:ready` to resume

### A3: Parallel task execution

Multiple tasks can run simultaneously:
1. Ready multiple tasks: `task:ready` for each
2. Start tasks in parallel (different impl agents)
3. Ensure no lock conflicts
4. Review and approve as they complete

### A4: Context loss mid-chain

Control agent loses context:
1. Run `choragen chain:status CHAIN-xxx`
2. Review chain progress and current state
3. Run `choragen task:next CHAIN-xxx` to find next action
4. Resume from current position

---

## Postconditions

- All tasks in chain are in `done/` status
- CR is moved to `done/` with completion notes
- File locks are released
- All changes are committed to git
- Chain metadata reflects completed state

---

## Error Conditions

| Error | Cause | Resolution |
|-------|-------|------------|
| "Chain already exists" | Duplicate chain ID | Use unique slug |
| "Lock conflict" | Files locked by another chain | Wait or coordinate release |
| "Task not found" | Invalid task ID | Check `task:list` |
| "Invalid transition" | Wrong task status | Check current status first |
| "Governance violation" | Modifying protected files | Check governance rules |

---

## Related Features

- [Task Chain Management](../features/task-chain-management.md)
- [File Locking](../features/file-locking.md)
- [Governance Enforcement](../features/governance-enforcement.md)

---

## Acceptance Criteria

- [ ] Chain can be created from a CR/FR
- [ ] Tasks can be added to the chain
- [ ] Tasks can transition through status workflow
- [ ] Chain status shows overall progress
- [ ] CR can be closed when chain completes

---

## Related Scenarios

- [Control Agent Workflow](../scenarios/control-agent-workflow.md)
- [Implementation Agent Workflow](../scenarios/implementation-agent-workflow.md)
