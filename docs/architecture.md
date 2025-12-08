# Choragen Architecture

## Philosophy

**The human is the bottleneck—no matter where they are in the loop.**

Choragen's architecture is designed around a single insight: the fastest path to shipping software isn't watching AI write code—it's elevating human attention from code to control structures.

Think of it like driving:
- **Vibe coding** = No steering wheel, hoping the car goes somewhere useful
- **Current AI tools** = Micromanaging every turn of the wheel  
- **Choragen** = Setting the destination, monitoring the route, intervening only when needed

The governance isn't friction. It's what lets you take your hands off the wheel.

### Proof of Concept

This architecture was validated on [itinerary-planner](https://github.com/jlneal/itinerary-planner): ~247,000 lines of code built in 61 days by a solo developer who never looked at the code. Zero production bugs. 67.5 commits/day sustained velocity.

---

## Overview

Choragen transforms stateless language models into stateful, accountable workers by providing:

1. **Persistent State** — Files are the source of truth, not agent memory
2. **Task Decomposition** — Work broken into context-window-sized chunks
3. **Governance** — Rules for what mutations are *enforced*, not suggested
4. **Coordination** — Locks prevent parallel workers from colliding
5. **Traceability** — Every change links back to intent
6. **Agent Runtime** — CLI spawns and orchestrates agent sessions directly (coming soon)

## Core Concepts

### Control Agent vs Implementation Agent

- **Control Agent**: Orchestrates work, maintains context across a task chain, reviews completions
- **Implementation Agent**: Executes individual tasks, reports results, operates with fresh context

The control agent's context is persistent within a chain. Implementation agents get fresh context per task, receiving only what they need from the task definition.

### Task Chains

A **chain** is a sequence of tasks derived from a Change Request (CR) or Fix Request (FR):

```
CR-20251205-001 (Intent)
  └── CHAIN-001-profile-backend/
        ├── 001-profile-api.md
        ├── 002-profile-repository.md
        └── 003-integration-tests.md
```

Tasks flow through kanban-style directories:
- `backlog/` — Planned but not started
- `todo/` — Ready to work
- `in-progress/` — Currently being worked
- `in-review/` — Awaiting approval
- `done/` — Completed
- `blocked/` — Cannot proceed

### Governance Schema

The `choragen.governance.yaml` file defines mutation rules:

```yaml
mutations:
  allow:
    - pattern: "components/**/*.tsx"
      actions: [create, modify]
  approve:
    - pattern: "supabase/migrations/*.sql"
      actions: [create, modify]
      reason: "Schema changes require review"
  deny:
    - pattern: "*.key"
```

### File Locking

Parallel chains acquire locks before starting:

```json
// .choragen/locks.json
{
  "chains": {
    "CHAIN-001-profile-backend": {
      "files": ["app/api/profile/**", "lib/profile/**"],
      "acquired": "2024-12-05T14:40:00Z",
      "agent": "cascade-session-abc"
    }
  }
}
```

### Traceability Chain

Every artifact links backward:

```
Request (CR/FR)
  → Design Doc (WHAT)
    → ADR (HOW)
      → Contract (Runtime validation)
        → Test (Verification)
          → Code (Implementation)
```

## Package Architecture

```
@choragen/core
├── tasks/      — Task and chain lifecycle
├── governance/ — Schema parsing and enforcement
├── locks/      — File locking and collision detection
└── protocol/   — Agent handoff message types

@choragen/cli
├── commands/
│   ├── chain/     — chain:new, chain:start, chain:status
│   ├── task/      — task:start, task:complete, task:approve
│   ├── governance/— governance:check
│   ├── lock/      — lock:acquire, lock:release
│   └── validate/  — validate:links, validate:test-coverage
└── bin.ts

@choragen/contracts
├── DesignContract — Runtime contract wrapper
├── ApiError       — Structured error class
└── HttpStatus     — HTTP status enum

@choragen/eslint-plugin
├── rules/
│   ├── traceability/  — ADR refs, design doc chains
│   ├── test-quality/  — Metadata, coverage, assertions
│   └── contracts/     — Design contracts, pre/postconditions
└── configs/
    ├── recommended
    └── strict

@choragen/test-utils
├── unsafeCast     — Type-safe partial mocks
├── TestOutputParser
└── DesignImpactAnalyzer
```

## Configuration

### choragen.config.js

```javascript
export default {
  paths: {
    adr: 'docs/adr/',
    design: 'docs/design/',
    requests: 'docs/requests/',
    tasks: 'docs/tasks/',
  },
  domains: ['my_domain'],
  governance: 'choragen.governance.yaml',
};
```

### ESLint Integration

```javascript
// eslint.config.mjs
import choragen from '@choragen/eslint-plugin';

export default [
  choragen.configs.recommended,
  {
    settings: {
      '@choragen': {
        adrPath: 'docs/adr/',
        designPath: 'docs/design/',
        domains: ['my_domain'],
      }
    }
  }
];
```

## Workflow

1. **Create Request** — Document intent in CR or FR
2. **Create Chain** — `choragen chain:new CR-xxx my-feature`
3. **Acquire Locks** — `choragen lock:acquire CHAIN-001 --files="app/api/**"`
4. **Start Task** — `choragen task:start CHAIN-001/001`
5. **Complete Task** — `choragen task:complete CHAIN-001/001`
6. **Review** — Control agent reviews, approves or requests rework
7. **Repeat** — Until chain complete
8. **Release Locks** — `choragen lock:release CHAIN-001`

## Agent Runtime (Coming Soon)

The Agent Runtime transforms Choragen from a framework agents *should* follow into an orchestrator that *enforces* governance.

```
┌─────────────────────────────────────────────────────────────┐
│                    $ choragen agent:start                   │
│                                                             │
│   1. CLI loads role-specific system prompt                  │
│   2. CLI calls LLM API with restricted tool set             │
│   3. LLM returns tool calls                                 │
│   4. CLI validates each tool call against governance        │
│   5. CLI executes allowed tools, rejects violations         │
│   6. If tool is "spawn_impl_session":                       │
│      - CLI starts nested agentic loop                       │
│      - Impl agent runs with impl-only tools                 │
│      - Impl agent completes, returns to control loop        │
│   7. Loop continues until agent signals completion          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Properties

- **Role-gated tools** — Control agents can't write files; impl agents can't approve tasks
- **Governance at execution** — Every tool call validated before running
- **Automatic handoffs** — Control spawns impl without human intervention
- **Multi-provider** — Anthropic, OpenAI, Gemini supported from day one

See [Agent Runtime Feature](design/core/features/agent-runtime.md) for full specification.

---

## Design Principles

1. **Files over Memory** — Agent context is ephemeral; files persist
2. **Explicit over Implicit** — Governance rules are declared, not inferred
3. **Traceability over Trust** — Every change must link to intent
4. **Coordination over Isolation** — Multiple agents can work in parallel safely
5. **Contracts over Comments** — Design intent validated at runtime
6. **Control over Supervision** — Humans navigate; agents drive
