# Task: Create role-specific agent documentation files

**Chain**: CHAIN-019-role-separation  
**Task**: 001-create-agent-docs  
**Status**: todo  
**Created**: 2025-12-07

---

## Objective

Create three new documentation files that define the control agent and implementation agent roles, plus handoff templates.

---

## Expected Files

- `docs/agents/control-agent.md`
- `docs/agents/impl-agent.md`
- `docs/agents/handoff-templates.md`

---

## Acceptance Criteria

- [ ] ### docs/agents/control-agent.md
- [ ] Must include:
- [ ] Role definition: "manages work but does NOT implement"
- [ ] Responsibilities: create CRs/FRs, create chains/tasks, review work, approve/rework, commit
- [ ] Workflow steps with explicit approval gate before any impl work
- [ ] When control-only execution is allowed (verify, review, close, commit tasks)
- [ ] Handoff procedure: generate prompt, wait for human to spawn impl agent
- [ ] What to do after impl reports completion (review, approve/rework, commit)
- [ ] ### docs/agents/impl-agent.md
- [ ] Must include:
- [ ] Role definition: "executes tasks from task files"
- [ ] Responsibilities: read task file, implement per acceptance criteria, run verification, report completion
- [ ] What NOT to do: move task files, approve own work, create new tasks
- [ ] How to start: read the task file path provided in handoff prompt
- [ ] How to finish: report what was done, list verification results, wait for control review
- [ ] ### docs/agents/handoff-templates.md
- [ ] Must include:
- [ ] Standard impl agent handoff prompt template
- [ ] Variables to fill in: project path, task file path
- [ ] Example filled-in prompt
- [ ] Notes on fresh session requirement

---

## Notes

Reference the current AGENTS.md for existing patterns. Extract and reorganize, don't invent new concepts.
