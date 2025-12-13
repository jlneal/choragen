# Feature: Ideation Workflow

**Domain**: core  
**Status**: draft  
**Created**: 2025-12-12  

---

## Overview

The Ideation Workflow is a dedicated workflow for exploring and refining ideas before committing to formal requests. It provides a structured process for brainstorming, scoping, and either discarding ideas or producing prioritized requests in the backlog.

This workflow is separate from the Standard Workflow, which executes committed requests. Ideation can happen independently and at a different cadence — exploratory rather than structured.

---

## Problem

Currently, there's no formal process for idea exploration:

1. **Premature commitment** — Ideas jump straight to request creation without refinement
2. **Lost context** — Exploratory conversations aren't captured
3. **No discard path** — No structured way to reject ideas with reasoning
4. **Backlog confusion** — No distinction between "explored and ready" vs "raw idea"

---

## Solution

A dedicated Ideation Workflow that:
- Provides structured exploration with an Ideation Agent
- Requires human approval before creating requests
- Outputs to backlog (not todo) — commitment happens separately
- Supports discarding ideas with documented reasoning

---

## Workflow Stages

| Stage | Role | Gate | Purpose |
|-------|------|------|---------|
| **exploration** | Ideation | human_approval | Understand and scope the idea |
| **proposal** | Ideation | human_approval | Propose request structure |
| **creation** | Ideation | auto | Draft and create request docs |

---

## Stage Details

### Stage 1: Exploration

**Role**: Ideation Agent  
**Purpose**: Understand the idea, challenge assumptions, identify scope

#### Flow

| Step | Actor | Type | Action |
|------|-------|------|--------|
| 1.1 | 👤 Human | input | Shares rough idea in chat |
| 1.2 | 🤖 Ideation | agent | Asks clarifying questions |
| 1.3 | 👤 Human | input | Responds, refines vision |
| 1.4 | 🤖 Ideation | agent | Challenges assumptions constructively |
| 1.5 | 🤖 Ideation | agent | Identifies scope, boundaries, sub-problems |
| 1.6 | 👤 Human | input | Confirms direction or pivots |
| 1.7 | 🚪 Gate | gate | `human_approval`: "Continue to request creation, or discard?" |

#### Gate Options

- **Continue** — Proceed to proposal stage
- **Discard** — End workflow with documented reasoning

#### Discard Handling

If discarded:
1. Ideation agent summarizes why the idea was rejected
2. Summary is logged to workflow history
3. Workflow ends in "discarded" state (not "completed")

---

### Stage 2: Proposal

**Role**: Ideation Agent  
**Purpose**: Propose request structure for human approval before drafting

#### Flow

| Step | Actor | Type | Action |
|------|-------|------|--------|
| 2.1 | 🤖 Ideation | agent | Proposes request(s) with: |
|     |              |       | - Title |
|     |              |       | - Scope (in/out) |
|     |              |       | - Rough acceptance criteria |
|     |              |       | - Suggested priority |
| 2.2 | 👤 Human | input | Reviews proposals |
| 2.3 | 👤 Human | input | Requests changes or approves |
| 2.4 | 🤖 Ideation | agent | Adjusts proposals based on feedback |
| 2.5 | 🚪 Gate | gate | `human_approval`: "Approve these request proposals?" |

#### Multiple Requests

A single ideation session may produce multiple requests:
- Large ideas broken into phases
- Related but independent changes
- Core request + follow-up enhancements

Each proposed request gets its own priority suggestion.

---

### Stage 3: Creation

**Role**: Ideation Agent  
**Purpose**: Draft the actual request documents

#### Flow

| Step | Actor | Type | Action |
|------|-------|------|--------|
| 3.1 | 🤖 Ideation | agent | Drafts request doc(s) based on approved proposals |
| 3.2 | 🔧 Tool | tool | `request:create` — creates CR doc(s) |
| 3.3 | ⚙️ Hook | hook | `onExit`: Move request(s) to backlog |
| 3.4 | ⚙️ Hook | hook | `onExit`: Log request creation |
| 3.5 | 🚪 Gate | gate | `auto`: Requests created, workflow complete |

#### Output Location

Requests are created in: `docs/requests/change-requests/backlog/`

**Not** in `todo/` — the commitment to work on a request is a separate decision.

---

## Request Lifecycle Integration

```
Ideation Workflow                    Standard Workflow
       │                                    │
       ▼                                    │
   [backlog]  ──── commitment ────▶  [todo] │
                   (manual)                 │
                                           ▼
                                    [doing] → [done]
```

The "commitment" step (backlog → todo) is a manual human decision, not part of either workflow. This allows:
- Multiple ideation sessions to feed the backlog
- Human to prioritize and batch work
- Clear line between "explored" and "committed"

---

## Workflow Template

```yaml
name: ideation
displayName: Ideation Workflow
description: Explore and refine ideas into actionable requests

stages:
  - name: exploration
    type: ideation
    role: ideation
    gate:
      type: human_approval
      prompt: "Continue to request creation, or discard this idea?"
      options:
        - label: Continue
          action: advance
        - label: Discard
          action: discard

  - name: proposal
    type: ideation
    role: ideation
    gate:
      type: human_approval
      prompt: "Approve these request proposals?"

  - name: creation
    type: ideation
    role: ideation
    gate:
      type: auto
    onExit:
      - type: file_move
        pattern: "docs/requests/change-requests/draft/*.md"
        destination: "docs/requests/change-requests/backlog/"
```

---

## Acceptance Criteria

- [ ] Ideation workflow template exists with three stages
- [ ] Exploration stage supports discard with documented reasoning
- [ ] Proposal stage requires human approval before drafting
- [ ] Creation stage outputs requests to backlog (not todo)
- [ ] Discarded workflows end in "discarded" state with summary
- [ ] Multiple requests can be created from single ideation session
- [ ] Workflow history captures full exploration conversation

---

## Linked Scenarios

- [Human-Driven Development](../scenarios/human-driven-development.md)

---

## Linked Features

- [Specialized Agent Roles](./specialized-agent-roles.md) (Ideation role)
- [Workflow Orchestration](./workflow-orchestration.md)
- [Standard Workflow](./standard-workflow.md)

---

## Open Questions

1. **Idea persistence** — Should discarded ideas be archived for future reference?
2. **Resumption** — Can a discarded idea be resumed later?
3. **Batching** — Can multiple ideas be explored in one ideation session?
4. **Priority algorithm** — How should the agent suggest priority?
