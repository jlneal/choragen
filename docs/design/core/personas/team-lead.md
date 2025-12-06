# Persona: Team Lead

**Domain**: core  
**Created**: 2025-12-06  

---

## Description

A technical lead or engineering manager coordinating a team of developers (human and/or AI). They need to break down large initiatives into manageable work items, assign tasks, track progress, and ensure quality through review processes. They balance hands-on coding with coordination responsibilities.

---

## Goals

- **Coordinate parallel work** without merge conflicts or duplicated effort
- **Maintain visibility** into what's being worked on and by whom
- **Ensure quality** through structured review and approval workflows
- **Preserve institutional knowledge** in documentation and decision records
- **Scale AI assistance** across the team safely

---

## Pain Points

- **Coordination overhead** - Too much time spent on status meetings and updates
- **Lock conflicts** - Multiple people editing the same files simultaneously
- **Context switching** - Losing track of multiple parallel initiatives
- **Review bottlenecks** - Work piling up waiting for approval
- **AI governance** - Ensuring AI assistants follow team conventions

---

## Key Workflows

1. **Planning a sprint or initiative**
   - Create CRs for each major work item
   - Break CRs into task chains with clear boundaries
   - Acquire locks for each chain's file scope

2. **Delegating work**
   - Assign chains to team members (human or AI)
   - Provide task files with full context
   - Monitor progress via `chain:status`

3. **Reviewing and approving**
   - Review completed tasks from team members
   - Use `task:approve` or `task:rework` to provide feedback
   - Ensure governance rules are followed

4. **Resolving conflicts**
   - Check `lock:status` to identify overlapping work
   - Coordinate lock releases between chains
   - Merge completed work safely

---

## Success Metrics

- **Cycle time** - How long from CR to completion?
- **Conflict rate** - How often do lock conflicts occur?
- **Review turnaround** - How long do tasks wait in review?
- **Team velocity** - Are more tasks completing per sprint?

---

## Linked Scenarios

- [Control Agent Workflow](../scenarios/control-agent-workflow.md)

---

## Linked Features

- [Task Chain Management](../features/task-chain-management.md)
- [File Locking](../features/file-locking.md)
- [Governance Enforcement](../features/governance-enforcement.md)
