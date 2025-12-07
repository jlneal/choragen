# Choragen Development Pipeline

This document describes the complete development pipeline that Choragen provides and uses for its own development.

## Pipeline Overview

```
Intent (User Request)
    ↓
Request Document (CR/FR)
    ↓
Design Documents (WHAT)
    ↓
Architecture Decision Records (HOW)
    ↓
Implementation (Code + Tests)
    ↓
Verification (Lint + Hooks + Validation)
```

## User Value Chain

The pipeline above shows the *implementation* flow, but every artifact must trace back to **user value**. This section documents the complete value chain from user personas to shipped code.

### Complete Value Chain Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER VALUE LAYER                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PERSONA (WHO benefits)                                             │
│  "Control Agent - orchestrates work, needs visibility"              │
│      │                                                              │
│      ▼                                                              │
│  SCENARIO (WHAT user goal)                                          │
│  "As a Control Agent, I want to see chain status                    │
│   so that I can coordinate implementation work"                     │
│      │                                                              │
│      │ (1-to-many)                                                  │
│      ▼                                                              │
│  USE CASE (HOW user accomplishes goal)                              │
│  ├── "View all active chains"                                       │
│  ├── "Check specific chain progress"                                │
│  └── "Identify blocked tasks"                                       │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                        SOLUTION LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│      │                                                              │
│      ▼                                                              │
│  FEATURE (WHAT we build)                                            │
│  "Chain status dashboard with progress tracking"                    │
│      │                                                              │
│      ▼                                                              │
│  CR/FR (WHY we're building it now)                                  │
│  "CR-20251207-001: Implement chain status command"                  │
│      │                                                              │
│      ▼                                                              │
│  ADR (HOW we build it technically)                                  │
│  "ADR-007: Chain status data model and CLI output format"           │
│      │                                                              │
│      ▼                                                              │
│  IMPLEMENTATION (Code + Tests)                                      │
│  "packages/cli/src/commands/chain-status.ts"                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Value Chain Levels

#### 1. Persona (WHO)

A persona is a user archetype that represents a class of users with shared goals and behaviors.

| Attribute | Description |
|-----------|-------------|
| **Definition** | Named archetype with goals, context, and pain points |
| **Location** | `docs/design/<domain>/personas/` |
| **Example** | "Control Agent", "Implementation Agent", "Project Lead" |
| **Purpose** | Grounds all work in real user needs |

#### 2. Scenario (WHAT goal)

A scenario describes a user goal in narrative form: "As a [persona], I want [goal] so that [benefit]."

| Attribute | Description |
|-----------|-------------|
| **Definition** | User story expressing intent and motivation |
| **Location** | `docs/design/<domain>/scenarios/` |
| **Relationship** | Many scenarios per persona |
| **Example** | "As a Control Agent, I want to see chain status so that I can coordinate work" |
| **Purpose** | Captures the *why* behind features |

#### 3. Use Case (HOW user accomplishes)

A use case describes a specific interaction pattern that fulfills part of a scenario.

| Attribute | Description |
|-----------|-------------|
| **Definition** | Concrete steps a user takes to accomplish a task |
| **Location** | `docs/design/<domain>/use-cases/` |
| **Relationship** | Many use cases per scenario (1-to-many) |
| **Example** | "View all active chains", "Filter chains by status" |
| **Purpose** | Defines testable user interactions |

**Key relationship**: One scenario may require multiple use cases to fully satisfy the user goal. Each use case should be independently testable.

#### 4. Feature (WHAT we build)

A feature is a capability we build to enable one or more use cases.

| Attribute | Description |
|-----------|-------------|
| **Definition** | A buildable unit of functionality |
| **Location** | `docs/design/<domain>/features/` |
| **Relationship** | One feature may enable multiple use cases |
| **Example** | "Chain status command with filtering" |
| **Purpose** | Defines scope for implementation |

#### 5. CR/FR (WHY now)

A Change Request (CR) or Fix Request (FR) justifies *why* we're building a feature at this time.

| Attribute | Description |
|-----------|-------------|
| **Definition** | Prioritized work item with business justification |
| **Location** | `docs/requests/change-requests/` or `docs/requests/fix-requests/` |
| **Relationship** | Links feature to current sprint/milestone |
| **Example** | "CR-20251207-001: Chain status needed for v0.2 release" |
| **Purpose** | Provides scheduling and priority context |

#### 6. ADR (HOW technically)

An Architecture Decision Record documents the technical approach for implementing a feature.

| Attribute | Description |
|-----------|-------------|
| **Definition** | Technical decision with context, options, and rationale |
| **Location** | `docs/adr/` |
| **Relationship** | One or more ADRs per feature |
| **Example** | "ADR-007: Use YAML for chain metadata storage" |
| **Purpose** | Captures technical decisions and trade-offs |

#### 7. Implementation (Code + Tests)

The actual code and tests that deliver the feature.

| Attribute | Description |
|-----------|-------------|
| **Definition** | Source code, tests, and configuration |
| **Location** | `packages/*/src/` |
| **Relationship** | References ADR in source comments |
| **Example** | `packages/cli/src/commands/chain-status.ts` |
| **Purpose** | Delivers user value |

### Relationship Summary

```
Persona ──(1:many)──► Scenario ──(1:many)──► Use Case
                                                │
                                           (many:many)
                                                │
                                                ▼
                                            Feature
                                                │
                                           (1:many)
                                                │
                                                ▼
                                             CR/FR
                                                │
                                           (1:many)
                                                │
                                                ▼
                                              ADR
                                                │
                                           (1:many)
                                                │
                                                ▼
                                         Implementation
                                                │
                                           (1:many)
                                                │
                                                ▼
                                            Commits
```

### Traceability Back to User Value

**Every artifact must be traceable back to user value.** This means:

| Artifact | Must Link To |
|----------|--------------|
| Commits | CR/FR (in commit message) |
| Implementation | ADR (in source comment) |
| ADR | CR/FR + Feature design doc |
| CR/FR | Feature it implements + Commits (bi-directional) |
| Feature | Use cases it enables |
| Use Case | Scenario it fulfills |
| Scenario | Persona it serves |

When reviewing any artifact, ask: *"Which user persona benefits from this, and how?"* If you can't answer, the traceability chain is broken.

### Integration with Existing Pipeline

The existing pipeline (CR → Design → ADR → Implementation) fits into the **Solution Layer** of the value chain:

```
┌─────────────────────────────────────────────────────────────────────┐
│  USER VALUE LAYER (documented in design/)                           │
│  Persona → Scenario → Use Case → Feature                            │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  SOLUTION LAYER (existing pipeline)                                 │
│  CR/FR → Design Docs → ADR → Implementation → Verification          │
└─────────────────────────────────────────────────────────────────────┘
```

The User Value Layer provides the *justification* for everything in the Solution Layer. Without it, we risk building technically excellent solutions that don't serve real user needs.

## Enforcement Layers

### Layer 1: ESLint Rules (Static Analysis)

ESLint rules enforce patterns at write-time:

| Rule | Purpose |
|------|---------|
| `require-adr-reference` | Source files must reference governing ADR |
| `require-design-doc-chain` | New features must link to design docs |
| `require-cr-fr-exists` | Commits must reference valid CR/FR |
| `require-test-metadata` | Tests must have @design-doc tags |
| `require-design-contract` | API routes must use DesignContract |
| `no-magic-numbers` | Use HttpStatus enum, not literals |

### Layer 2: Git Hooks (Commit-Time)

Git hooks enforce patterns at commit-time:

| Hook | Purpose |
|------|---------|
| `pre-commit` | Lint staged files, check formatting |
| `commit-msg` | Validate commit message format, CR/FR reference |
| `pre-push` | Run tests, check traceability |

### Layer 3: Validation Scripts (CI/Manual)

Validation scripts verify the complete picture:

| Script | Purpose |
|--------|---------|
| `validate:links` | Check design ↔ implementation links |
| `validate:test-coverage` | Check design ↔ test links |
| `validate:adr-traceability` | Check ADR ↔ implementation links |
| `validate:commit-traceability` | Check commits reference CR/FR |

## Document Types

### Change Requests (CR)

New features, enhancements, refactors.

```
docs/requests/change-requests/
├── todo/       # Planned
├── doing/      # In progress
└── done/       # Completed
```

### Fix Requests (FR)

Bugs, design flaws, regressions.

```
docs/requests/fix-requests/
├── todo/
├── doing/
└── done/
```

### Design Documents

User-focused documentation of WHAT we're building.

```
docs/design/<domain>/
├── personas/       # User archetypes
├── scenarios/      # User goals and stories
├── use-cases/      # Specific usage patterns
├── features/       # Capabilities to build
└── enhancements/   # Improvements to make
```

### Architecture Decision Records (ADR)

Technical documentation of HOW we're building it.

```
docs/adr/
├── todo/       # Decisions not yet implemented
├── doing/      # Decisions being implemented
├── done/       # Decisions controlling current implementation
└── archive/    # Superseded decisions
```

## Chain Types and the Pipeline

The conceptual pipeline stages map directly to **chain types** defined in [ADR-006](../adr/done/ADR-006-chain-type-system.md).

### How Chain Types Map to Pipeline Stages

```
Request (CR/FR)
    ↓
┌─────────────────────────────────────────────────────┐
│  DESIGN CHAIN                                       │
│  ├── Design Documents (WHAT)                        │
│  └── Architecture Decision Records (HOW)            │
└─────────────────────────────────────────────────────┘
    ↓ (dependsOn)
┌─────────────────────────────────────────────────────┐
│  IMPLEMENTATION CHAIN                               │
│  ├── Implementation (Code + Tests)                  │
│  └── Verification (Lint + Hooks + Validation)       │
└─────────────────────────────────────────────────────┘
```

| Chain Type | Pipeline Stages | Outputs |
|------------|-----------------|---------|
| **Design** | Design Documents, ADRs | Feature specs, acceptance criteria, architecture decisions |
| **Implementation** | Implementation, Verification | Code, tests, configuration |

### Chain Pairing Pattern

Design and implementation chains form pairs linked to the same CR/FR:

```
CR-20251207-001 (Change Request)
  │
  ├── CHAIN-001-user-profile (type: design)
  │     └── Tasks: create design doc, define API, write ADR
  │
  └── CHAIN-002-user-profile-impl (type: implementation)
        ├── dependsOn: CHAIN-001-user-profile
        └── Tasks: implement API, write tests
```

**Workflow sequence**:
1. Create design chain first
2. Complete all design tasks (design docs, ADRs)
3. Get design approved
4. Create implementation chain with `dependsOn` reference
5. Execute implementation tasks

### Skipping Design (skipDesign)

For justified exceptions, implementation chains can skip the design dependency:

```bash
choragen chain:new:impl FR-001 hotfix-login "Fix Login Bug" \
  --skip-design="Hotfix for production issue, design not required"
```

Appropriate uses:
- Hotfixes for production bugs
- Trivial changes (typo fixes)
- Documentation-only changes

The `skipDesign` flag requires a justification, maintaining an audit trail for exceptions.

---

## Traceability Requirements

### Every Commit Must:
1. Reference a CR or FR (except exempt types)
2. Follow semantic commit format
3. Pass pre-commit hooks

### Every Source File Must:
1. Reference its governing ADR in a comment
2. Link to design docs if implementing a feature

### Every Test File Must:
1. Have `@design-doc` metadata tag
2. Have `@user-intent` describing what's being tested
3. Link back to the design doc's acceptance tests section

### Every ADR Must:
1. Link to the CR/FR that motivated it
2. Link to design docs it implements
3. List implementation files when in `done/`

### Every Design Doc Must:
1. Link to related ADRs
2. Have acceptance tests section
3. Link to implementation when complete

## Exempt Commit Types

Some commits don't require CR/FR references:

- `chore(deps)` - Dependency updates
- `chore(format)` - Formatting only
- `chore(tooling)` - Build/CI changes
- `chore(planning)` - Creating CR/FR docs themselves

## Self-Hosting

Choragen uses this pipeline for its own development:

1. CRs track feature work
2. ADRs document decisions
3. Design docs describe features
4. ESLint rules enforce patterns
5. Git hooks validate commits
6. Validation scripts verify links

This document itself is part of the self-hosted documentation.
