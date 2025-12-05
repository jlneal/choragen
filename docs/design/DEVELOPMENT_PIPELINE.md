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
