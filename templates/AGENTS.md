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
| `rework-task.md` | Rework tasks for completed tasks | `docs/tasks/todo/<chain-id>/` |
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

### Task Type Field

Tasks include a `**Type**` field that determines which agent handles the task:

| Value | Description | When to Use |
|-------|-------------|-------------|
| `impl` | Implementation agent | Default. Code changes, feature implementation, bug fixes |
| `control` | Control agent | Verification, review, closure, documentation-only tasks |

**Guidelines:**
- Use `impl` (default) for any task requiring code changes
- Use `control` for tasks the control agent can complete directly without handoff
- Control tasks typically involve: verification, approval workflows, documentation updates, chain/request closure

## Task Templates

Task templates provide reusable prompts with variable interpolation for tasks created via `choragen task:add --template <name>`. Templates live in `templates/task-templates/` as YAML files.

### Available Task Templates

| Template | Type | Purpose |
|----------|------|---------|
| `generic.yaml` | impl | General-purpose implementation tasks |
| `design.yaml` | impl | Design/architecture tasks |
| `review.yaml` | control | Review and verification tasks |
| `persona-design.yaml` | impl | Persona definition (design workflow) |
| `scenario-design.yaml` | impl | Scenario definition (design workflow) |
| `use-case-design.yaml` | impl | Use case definition (design workflow) |
| `feature-design.yaml` | impl | Feature definition (design workflow) |
| `adr-design.yaml` | impl | ADR creation (design workflow) |

### Task Template Schema

**Required fields:**

| Field | Description |
|-------|-------------|
| `name` | Template identifier (matches filename) |
| `type` | Task category: `impl`, `control`, `review` |
| `defaultPrompt` | Multi-line prompt with `{{variable}}` interpolation |

**Optional fields:**

| Field | Description |
|-------|-------------|
| `description` | When to use this template |
| `constraints` | Array of constraints surfaced with the task |
| `expectedFiles` | Array of expected output file paths |

### Task Template Variables

The `defaultPrompt` field supports these variables, resolved at task creation:

| Variable | Description |
|----------|-------------|
| `{{taskId}}` | Task identifier (e.g., `001-my-task`) |
| `{{taskTitle}}` | Task title |
| `{{chainId}}` | Parent chain ID |
| `{{requestId}}` | Linked request ID |
| `{{domain}}` | Feature domain |
| `{{acceptanceCriteria}}` | Formatted acceptance criteria |
| `{{objective}}` | Task objective/description |
| `{{context}}` | Chain context/description |

### Using Task Templates

```bash
# Create task with template
choragen task:add CHAIN-001-my-chain my-task "My Task Title" --template generic

# Template prompt is interpolated and written to task notes
```

See `templates/task-templates/schema.md` for full schema documentation.

## Design Workflow

The design workflow (`workflow-templates/design.yaml`) provides structured design chains following the user value chain:

```
Persona → Scenario → Use Case → Feature → ADR
```

### Stages

| Stage | Task Template | Output Location |
|-------|---------------|-----------------|
| `persona` | `persona-design.yaml` | `docs/design/{{domain}}/personas/` |
| `scenario` | `scenario-design.yaml` | `docs/design/{{domain}}/scenarios/` |
| `use-case` | `use-case-design.yaml` | `docs/design/{{domain}}/use-cases/` |
| `feature` | `feature-design.yaml` | `docs/design/{{domain}}/features/` |
| `adr` | `adr-design.yaml` | `docs/adr/todo/` |
| `completion` | (none) | Review and finalize |

### Skip Mechanism

Stages can be skipped when not applicable:

1. Agent marks task complete with note: `"No changes required: [justification]"`
2. Gate advances automatically after human approval
3. Audit trail preserved in task completion notes

**Example skip justification:**
```
No changes required: Existing "Control Agent" persona in docs/design/core/personas/control-agent.md covers this work.
```

### Relationship to Standard Workflow

The design workflow is **invoked by** the standard workflow's design stage:

```
Standard Workflow                    Design Workflow
─────────────────                    ───────────────
planning stage
    ↓
design stage ──────────────────────► Creates/executes design chain
    ↓                                (persona → scenario → ... → adr)
impl-planning stage
    ↓
...
```

---

### Rework-Task-Specific Variables

| Variable | Description |
|----------|-------------|
| `{{TITLE}}` | Original task title |
| `{{TASK_ID}}` | Rework task identifier |
| `{{CHAIN_ID}}` | Parent chain ID |
| `{{ORIGINAL_TASK_ID}}` | ID of the task being reworked |
| `{{ORIGINAL_TASK_FILE}}` | Filename of the original task |
| `{{REWORK_REASON}}` | Reason for the rework |

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
