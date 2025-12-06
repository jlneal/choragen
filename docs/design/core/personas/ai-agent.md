# Persona: AI Agent

**Domain**: core  
**Created**: 2025-12-06  

---

## Description

An AI coding assistant (like Claude, GPT, or similar) operating as either a control agent or implementation agent within the choragen framework. AI agents have limited context windows, no persistent memory between sessions, and need explicit structure to work effectively on complex tasks.

---

## Goals

- **Receive clear context** to understand what needs to be done
- **Know boundaries** of what files can be modified
- **Complete discrete tasks** that fit within context limits
- **Preserve work** so it survives session boundaries
- **Follow conventions** established by the project

---

## Pain Points

- **Context limits** - Cannot hold entire codebase in memory
- **Session amnesia** - No memory of previous conversations
- **Unclear scope** - Not knowing what files are safe to modify
- **Conflicting instructions** - Different sessions giving different guidance
- **No verification** - Cannot confirm work meets requirements without structure

---

## Key Workflows

### As Control Agent

1. **Receive a CR/FR** from human or another system
2. **Create task chain** with `chain:new`
3. **Break down work** into context-sized tasks
4. **Acquire locks** for the chain's file scope
5. **Delegate tasks** to implementation agents
6. **Review and approve** completed work
7. **Release locks** when chain completes

### As Implementation Agent

1. **Receive task assignment** with task file path
2. **Read task file** for full context and acceptance criteria
3. **Check governance** before modifying files
4. **Implement changes** according to task specification
5. **Run verification** (tests, linting, type checking)
6. **Report completion** to control agent
7. **Await review** for approval or rework

---

## Success Metrics

- **Task completion rate** - Are tasks being finished successfully?
- **Governance compliance** - Are file mutations within allowed scope?
- **Context efficiency** - Is the task file sufficient without additional queries?
- **Rework rate** - How often are tasks sent back for revision?

---

## Linked Scenarios

- [Control Agent Workflow](../scenarios/control-agent-workflow.md)
- [Implementation Agent Workflow](../scenarios/implementation-agent-workflow.md)

---

## Linked Features

- [Task Chain Management](../features/task-chain-management.md)
- [Governance Enforcement](../features/governance-enforcement.md)
- [File Locking](../features/file-locking.md)
