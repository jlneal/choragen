# Choragen Architecture

## Overview

Choragen transforms stateless language models into stateful, accountable workers by providing:

1. **Persistent State** — Files are the source of truth, not agent memory
2. **Task Decomposition** — Work broken into context-window-sized chunks
3. **Governance** — Rules for what mutations are allowed
4. **Coordination** — Locks prevent parallel workers from colliding
5. **Traceability** — Every change links back to intent

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

## Design Principles

1. **Files over Memory** — Agent context is ephemeral; files persist
2. **Explicit over Implicit** — Governance rules are declared, not inferred
3. **Traceability over Trust** — Every change must link to intent
4. **Coordination over Isolation** — Multiple agents can work in parallel safely
5. **Contracts over Comments** — Design intent validated at runtime
