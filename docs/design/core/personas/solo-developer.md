# Persona: Solo Developer

**Domain**: core  
**Created**: 2025-12-06  

---

## Description

A solo developer working on personal projects, side projects, or freelance work. They work alone but want the discipline and traceability that comes from structured development practices. They may use AI coding assistants frequently and want to maintain consistency across sessions.

---

## Goals

- **Maintain project continuity** across coding sessions and context switches
- **Track decisions** so they remember why they made certain choices months later
- **Coordinate with AI assistants** effectively without losing work or context
- **Ship reliable software** despite working without a team for code review
- **Build good habits** that scale if the project grows

---

## Pain Points

- **Context loss** between coding sessions - forgetting what they were working on
- **AI assistant drift** - assistants making changes that conflict with project conventions
- **Decision amnesia** - not remembering why certain architectural choices were made
- **Scope creep** - starting tasks without clear boundaries, leading to incomplete work
- **No accountability** - easy to skip tests or documentation when working alone

---

## Key Workflows

1. **Starting a new feature**
   - Create a CR to document intent
   - Break into tasks that fit within a single session
   - Use governance rules to protect critical files

2. **Resuming work after a break**
   - Check `chain:status` to see where they left off
   - Read task files to restore context
   - Continue from `task:next`

3. **Working with AI assistants**
   - Hand off task files with full context
   - Review AI output before approval
   - Use governance to prevent unauthorized changes

---

## Success Metrics

- **Time to resume** - How quickly they can pick up where they left off
- **Decision recall** - Can they explain past architectural choices?
- **Completion rate** - Are tasks being finished, not abandoned?
- **Code quality** - Is the solo code as good as team code?

---

## Linked Scenarios

- [Control Agent Workflow](../scenarios/control-agent-workflow.md)
- [Implementation Agent Workflow](../scenarios/implementation-agent-workflow.md)

---

## Linked Features

- [Task Chain Management](../features/task-chain-management.md)
- [Governance Enforcement](../features/governance-enforcement.md)
