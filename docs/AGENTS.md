# Agent Guidelines for docs/

This directory contains all project documentation following the Choragen development pipeline.

## Directory Structure

```
docs/
├── requests/              # Stream: Transient change/fix requests
│   ├── change-requests/
│   │   ├── todo/
│   │   ├── doing/
│   │   └── done/
│   └── fix-requests/
│       ├── todo/
│       ├── doing/
│       └── done/
│
├── adr/                   # Pool: Architecture Decision Records
│   ├── todo/              # Decisions not yet implemented
│   ├── doing/             # Decisions being implemented
│   ├── done/              # Decisions controlling current implementation
│   └── archive/           # Superseded decisions
│
├── design/                # Pool: Design documentation (WHAT to build)
│   └── core/
│       ├── scenarios/
│       ├── features/
│       └── enhancements/
│
├── tasks/                 # Task chains for implementation work
│   ├── .chains/           # Chain metadata
│   ├── backlog/           # Future tasks
│   ├── todo/              # Ready to start
│   ├── in-progress/       # Currently being worked
│   ├── in-review/         # Awaiting approval
│   └── done/              # Completed tasks
│
└── architecture.md        # System overview
```

## Development Pipeline

The pipeline flows from intent to implementation:

```
Request (CR/FR) — Stream docs (transient)
  ↓
Design Docs (WHAT: scenarios, features) — Pool docs (persistent)
  ↓
ADRs (HOW: architecture decisions) — Pool docs (persistent)
  ↓
Implementation (Code + Tests) — Source as documentation
```

See `docs/design/DEVELOPMENT_PIPELINE.md` for complete workflow.

## Creating Documents

### Change Request (CR)

Create in `requests/change-requests/todo/`:

```markdown
# Change Request: Feature Name

**ID**: CR-YYYYMMDD-NNN
**Domain**: core
**Status**: todo
**Created**: YYYY-MM-DD
```

Use template: `templates/change-request.md`

### Fix Request (FR)

Create in `requests/fix-requests/todo/`:

```markdown
# Fix Request: Bug Description

**ID**: FR-YYYYMMDD-NNN
**Domain**: core
**Status**: todo
**Severity**: high|medium|low
```

Use template: `templates/fix-request.md`

### Architecture Decision Record (ADR)

Create in `adr/todo/`:

```markdown
# ADR-NNN: Decision Title

**Status**: todo
**Linked CR/FR**: CR-YYYYMMDD-NNN
**Linked Design Docs**: docs/design/core/features/xxx.md
```

Use template: `templates/adr.md`

### Feature Design Doc

Create in `design/core/features/`:

```markdown
# Feature: Feature Name

**Domain**: core
**Status**: draft
```

Use template: `templates/feature.md`

## Document Lifecycle

### Requests (CR/FR)

1. Create in `todo/`
2. Move to `doing/` when work starts
3. Move to `done/` when complete (add completion notes)

### ADRs

1. Create in `todo/`
2. Move to `doing/` when implementing
3. Move to `done/` when complete (add implementation references)
4. Move to `archive/` when superseded

## Traceability Requirements

Every artifact must link backward:

- **ADRs** → must reference CR/FR and design docs
- **Design docs** → should reference linked ADRs
- **Source files** → should reference governing ADR

## Validation

Run these scripts to validate documentation:

```bash
node scripts/validate-links.mjs
node scripts/validate-adr-traceability.mjs
```
