# Scenario: Human-Driven Development

**Domain**: core  
**Created**: 2025-12-10  
**Status**: draft  

---

## Overview

A human drives project development through a web-based chat interface, giving high-level instructions to agent sessions. Agents translate human intent into Choragen operations (creating requests, chains, tasks) and execute work through the structured pipeline. The human observes, guides, and approves—but rarely touches Choragen primitives directly.

---

## The Chassis Metaphor

Choragen is a **chassis** that wraps around the powerful but "gooey" center of LLMs:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CHORAGEN CHASSIS                               │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    Human (Web Chat Interface)                    │   │
│   │   "Add pagination to the backlog view"                          │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                   │                                     │
│                                   ▼                                     │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                     Workflow Orchestrator                        │   │
│   │   Stages: Design → Review → Implement → Verify                  │   │
│   │   Gates: Human approval, chain completion, verification pass    │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                   │                                     │
│                                   ▼                                     │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                      Agent Sessions                              │   │
│   │   Control Session → spawns → Impl Sessions                      │   │
│   │   Role-gated tools, governance enforcement                      │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                   │                                     │
│                                   ▼                                     │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                         LLM (Engine)                             │   │
│   │   Powerful capability, but constrained by chassis               │   │
│   │   Can only do what the runtime exposes for current stage/role   │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

The LLM is the engine—powerful, capable of anything. The chassis (Choragen) makes it steerable and trustworthy by:
- **Constraining tools** to what's appropriate for the current role and stage
- **Enforcing governance** at execution time, not via suggestions
- **Gating progress** through explicit stage transitions
- **Capturing audit trails** of every decision and action

---

## Actors

- **Human** — Project owner interacting via web chat
- **Control Agent** — Manages work, creates requests/chains, reviews
- **Implementation Agent** — Executes tasks, writes code

---

## Preconditions

- Choragen project initialized with governance rules
- Web app running with chat interface
- LLM API credentials configured
- Human has access to web dashboard

---

## Flow

### 1. Human Initiates Work

Human opens web chat and types:
> "We need to add pagination to the backlog view. The list is getting too long."

### 2. Control Agent Interprets Intent

The control session:
1. Understands this is a feature request
2. Creates `CR-20251210-004-backlog-pagination`
3. Reports back: "I've created a change request for backlog pagination. Should I proceed with the design chain?"

### 3. Human Approves Design Phase

Human responds:
> "Yes, go ahead."

### 4. Workflow Creates Design Stage

The workflow orchestrator:
1. Creates design chain: `CHAIN-051-backlog-pagination-design`
2. Spawns control session scoped to this chain
3. Control agent creates design tasks:
   - Task 1: Define pagination UX
   - Task 2: Document API changes
   - Task 3: Create ADR for implementation approach

### 5. Design Work Executes

Control agent works through design tasks, producing:
- Feature design doc in `docs/design/core/features/`
- ADR in `docs/adr/todo/`

Reports back: "Design complete. Here's the summary: [pagination approach]. Ready for your review."

### 6. Human Reviews Design (Gate)

Human reviews the design docs (linked in chat), responds:
> "Looks good. One change: use cursor-based pagination, not offset."

Control agent updates docs, confirms: "Updated to cursor-based. Proceed to implementation?"

### 7. Human Approves Implementation Phase

Human responds:
> "Yes."

### 8. Workflow Creates Implementation Stage

The workflow orchestrator:
1. Creates impl chain: `CHAIN-052-backlog-pagination-impl`
2. Links it to design chain via `dependsOn`
3. Control session creates implementation tasks

### 9. Implementation Executes

Control agent spawns impl sessions for each task:
- Impl session 1: Implement cursor pagination in API
- Impl session 2: Update backlog component
- Impl session 3: Add tests

Each impl session:
- Receives only impl-appropriate tools
- Has governance enforced at execution time
- Reports completion back to control session

### 10. Control Reviews Implementation

Control agent reviews each completed task:
- Runs verification commands
- Checks acceptance criteria
- Approves or sends back for rework

### 11. Human Final Approval (Gate)

Control agent reports: "Implementation complete. All tests pass. Ready for final review."

Human can:
- Review the changes (diff view in web app)
- Ask questions ("What files were changed?")
- Approve: "Ship it."
- Request changes: "The loading state needs work."

### 12. Workflow Completes

On approval:
1. Control agent commits with proper CR reference
2. Workflow moves to `completed`
3. CR moves to `done`
4. Audit trail captured

---

## Postconditions

- CR created with full traceability
- Design docs and ADR produced
- Implementation complete with tests
- All changes committed with proper references
- Full conversation history preserved as audit trail

---

## Acceptance Criteria

- [ ] Human can initiate work via natural language in web chat
- [ ] Control agent translates intent into Choragen primitives (CR, chains, tasks)
- [ ] Workflow stages enforce sequential progression with gates
- [ ] Human approval gates block progress until explicitly approved
- [ ] Impl agents receive only role-appropriate tools
- [ ] All agent actions are captured in workflow message history
- [ ] Final approval triggers commit with proper CR reference
- [ ] Full audit trail is preserved and queryable

---

## Key Principles

### Human Gives Intent, Not Commands

The human says "add pagination" not "create CR, then create chain, then add task..."

The agent translates intent into structured operations.

### Process is Enforced, Not Suggested

- Stages must complete before advancing
- Gates require explicit approval
- Governance is checked at execution time
- Role boundaries are code, not convention

### Visibility Without Micromanagement

Human can:
- See what's happening at any time
- Drill into details when needed
- Override or redirect when necessary
- Trust the process when it's working

### The Assembly Line

Work flows through defined stages:

```
Intent → Request → Design → Review → Implement → Verify → Complete
```

Each stage has:
- **Entry criteria** — What must be true to start
- **Tools available** — What operations are allowed
- **Exit criteria** — What must be true to proceed
- **Gate** — Who/what approves advancement

---

## Persona Value

### [Solo Developer](../personas/solo-developer.md)

**Value**: Can drive complex multi-step work through natural conversation. The system handles the procedural overhead—creating requests, managing chains, enforcing governance—so the developer focuses on intent and review.

### [AI Agent](../personas/ai-agent.md)

**Value**: Receives clear stage context and constrained tool sets. Cannot accidentally violate process because the runtime only exposes what's appropriate for the current stage and role.

### [Team Lead](../personas/team-lead.md)

**Value**: Gains confidence that work follows the defined process. Audit trail shows exactly how decisions were made and who approved what.

### [Open Source Maintainer](../personas/open-source-maintainer.md)

**Value**: Can delegate to AI with trust. The chassis ensures contributions follow project standards regardless of which agent or human is driving.

---

## Linked Use Cases

- [Start Workflow from Chat](../use-cases/start-workflow-from-chat.md) (to be created)
- [Approve Stage Gate](../use-cases/approve-stage-gate.md) (to be created)
- [Review Agent Work](../use-cases/review-agent-work.md) (to be created)

---

## Linked Features

- [Agent Runtime](../features/agent-runtime.md)
- [Workflow Orchestration](../features/workflow-orchestration.md) (to be created)
- [Web Chat Interface](../features/web-chat-interface.md) (to be created)

---

## Notes

This scenario represents the north star for Choragen: a system where humans provide intent and oversight while agents handle execution within enforced process boundaries. The "chassis" metaphor captures the essence—we're not limiting what LLMs can do, we're channeling their power through a structure that makes it trustworthy and auditable.
