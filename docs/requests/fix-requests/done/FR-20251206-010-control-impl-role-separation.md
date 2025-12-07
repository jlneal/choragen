# Fix Request: Control/Impl Agent Role Separation

**ID**: FR-20251206-010  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-06  
**Severity**: high  
**Owner**: agent  

---

## Problem

Control agents are implementing code directly instead of handing off to impl agents. This violates the core separation principle and undermines:

1. **Context boundaries** — Impl agents should work from task files alone
2. **Review integrity** — Control agents reviewing their own work
3. **Traceability** — No clear handoff audit trail
4. **Task file quality** — No pressure to write complete task specs

---

## Expected Behavior

1. Control agent creates CR/FR, chains, and tasks
2. Control agent generates handoff prompts for impl agents
3. Human spawns impl agent in fresh session with handoff prompt
4. Impl agent reads task file, implements, reports completion
5. Control agent reviews and approves/reworks
6. Control agent commits

---

## Actual Behavior

Control agent creates tasks then implements them directly in the same session, bypassing the handoff and fresh-context requirements.

---

## Root Cause Analysis

1. **AGENTS.md is too large** — Role-specific guidance buried in a monolithic file
2. **No explicit task type field** — Tasks don't declare `control` vs `impl` executor
3. **No handoff prompt generation** — Control agents don't produce ready-to-paste prompts
4. **No approval gate** — Nothing stops control agent from implementing directly

---

## Proposed Fix

### 1. Split AGENTS.md by Role

```
AGENTS.md                        # Minimal common patterns only
docs/agents/
├── control-agent.md             # Control agent workflow & responsibilities
├── impl-agent.md                # Impl agent workflow & responsibilities
└── handoff-templates.md         # Ready-to-paste handoff prompts
```

### 2. Add Task Type Field

Every task must declare its executor:

```markdown
**Type**: impl      # Must hand off to impl agent
**Type**: control   # Control agent executes directly
```

Control-only tasks: verify, review, close, commit, documentation-only changes.

### 3. Control Agent Approval Gate

When control agent is about to do impl work, they must:
1. State: "This requires impl work. Hand off or proceed directly?"
2. Wait for explicit human approval before implementing

### 4. Handoff Prompt Generation

After creating impl tasks, control agent outputs:

```markdown
## Ready for Implementation

### Task: CHAIN-XXX / 001-task-slug

Paste this to a fresh impl agent session:

---
You are an implementation agent working on choragen at /Users/justin/Projects/choragen

Your task: docs/tasks/todo/CHAIN-XXX-slug/001-task-slug.md

Read that file. Complete the work per acceptance criteria. Run verification commands. Report back what you completed. Do NOT move task files.
---
```

### 5. Update Task Template

Add `**Type**: impl | control` field to task template.

---

## Affected Files

- `AGENTS.md` (simplify, extract role-specific content)
- `docs/agents/control-agent.md` (new)
- `docs/agents/impl-agent.md` (new)
- `docs/agents/handoff-templates.md` (new)
- `templates/task.md` (add Type field)

---

## Linked ADRs

- ADR-001-task-file-format

---

## Verification

- [x] AGENTS.md is significantly smaller (528 → 196 lines)
- [x] Role-specific docs exist in docs/agents/
- [x] Task template includes Type field
- [x] Control agent workflow documented with approval gate
- [x] Handoff prompt template documented

---

## Completion Notes

**Completed**: 2025-12-06

**Changes made:**
1. Created `docs/agents/control-agent.md` - Control agent role, workflow, approval gate
2. Created `docs/agents/impl-agent.md` - Impl agent role, boundaries, completion reporting
3. Created `docs/agents/handoff-templates.md` - Standard handoff prompt template
4. Simplified `AGENTS.md` from 528 to 196 lines, added links to role docs
5. Updated `templates/task.md` with `**Type**: impl | control` field

**Task Chain**: CHAIN-019-role-separation (4 tasks completed)

**Process note**: This FR was executed using the new control/impl separation pattern. Tasks 1-3 were handed off to impl agents in fresh sessions; task 4 was a control-only verification task.
