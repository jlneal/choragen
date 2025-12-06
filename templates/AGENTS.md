# Agent Guidelines for templates/

This directory contains document templates for the Choragen development pipeline.

## Available Templates

| Template | Purpose | Output Location |
|----------|---------|-----------------|
| `change-request.md` | New features, enhancements | `docs/requests/change-requests/todo/` |
| `fix-request.md` | Bugs, design flaws | `docs/requests/fix-requests/todo/` |
| `adr.md` | Architecture decisions | `docs/adr/todo/` |
| `feature.md` | Feature design docs | `docs/design/core/features/` |
| `task.md` | Task chain tasks | `docs/tasks/todo/<chain-id>/` |
| `choragen.config.js` | Project configuration | Project root |
| `choragen.governance.yaml` | Governance rules | Project root |

## Template Variables

Templates use `{{VARIABLE}}` syntax for placeholders:

### Common Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{TITLE}}` | Document title | `Task Chain Management` |
| `{{DATE}}` | Date in YYYYMMDD format | `20251206` |
| `{{DATE_FORMATTED}}` | Date in YYYY-MM-DD format | `2025-12-06` |
| `{{SEQ}}` | Sequence number | `001` |
| `{{DOMAIN}}` | Feature domain | `core` |
| `{{OWNER}}` | Document owner | `agent` |
| `{{STATUS}}` | Document status | `todo` |

### Request-Specific Variables

| Variable | Description |
|----------|-------------|
| `{{DESCRIPTION}}` | What the change does |
| `{{MOTIVATION}}` | Why the change is needed |
| `{{IN_SCOPE_N}}` | Items in scope |
| `{{OUT_OF_SCOPE_N}}` | Items out of scope |
| `{{SEVERITY}}` | Fix request severity (high/medium/low) |

### ADR-Specific Variables

| Variable | Description |
|----------|-------------|
| `{{CONTEXT}}` | Problem context |
| `{{DECISION}}` | The decision made |
| `{{POSITIVE_N}}` | Positive consequences |
| `{{NEGATIVE_N}}` | Negative consequences |
| `{{MITIGATION_N}}` | Mitigations for negatives |
| `{{CR_FR_ID}}` | Linked CR or FR ID |
| `{{DESIGN_DOC}}` | Linked design document |

### Task-Specific Variables

| Variable | Description |
|----------|-------------|
| `{{CHAIN_ID}}` | Parent chain ID |
| `{{TASK_ID}}` | Task identifier |
| `{{OBJECTIVE}}` | Task objective |
| `{{CRITERION_N}}` | Acceptance criteria |

## Using Templates

### Manual Usage

1. Copy template to target location
2. Replace all `{{VARIABLE}}` placeholders
3. Remove unused optional sections

### CLI Usage (Future)

```bash
choragen cr:new core my-feature
choragen fr:new core my-bug
choragen adr:new my-decision
```

## Adding New Templates

1. Create template file with `.md` extension
2. Use `{{VARIABLE}}` syntax for placeholders
3. Include required sections for the document type
4. Add placeholder text that explains what goes in each section
5. Update this file's "Available Templates" table

## Template Conventions

### Required Sections

Each template should include:

- **Header** with ID, status, dates
- **Core content** sections specific to document type
- **Links** section for traceability
- **Completion notes** placeholder (for stream docs)

### Placeholder Style

Use descriptive placeholders:

```markdown
## Context

{{CONTEXT}}
```

Not:

```markdown
## Context

[Write context here]
```
