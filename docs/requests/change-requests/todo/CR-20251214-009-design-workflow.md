# Change Request: Design Workflow

**ID**: CR-20251214-009  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-14  
**Owner**: agent

---

## Description

Create a dedicated design workflow (`design.yaml`) with a pre-defined chain of design tasks following the user value chain: Persona → Scenario → Use Case → Feature → ADR. Each stage has a task template with a default prompt guiding the agent through that design artifact.

The workflow enforces the sequence but allows stages to be marked "No changes required" when not applicable.

---

## Motivation

The development pipeline documents a clear design progression (Persona → Scenario → Use Case → Feature → ADR) but there's no workflow that enforces or guides this structure. Currently:

1. Design work is ad-hoc — agents decide what artifacts to create
2. No consistent prompts for design tasks
3. Standard workflow's `design` stage is generic ("work through design chains")

A dedicated design workflow provides:

- **Structured design chains** with predictable task sequence
- **Consistent guidance** via task template prompts
- **Traceability** — each design artifact links to the next
- **Flexibility** — stages can be skipped with justification

---

## Scope

### In Scope

- New `templates/workflow-templates/design.yaml` workflow
- Five design stages: `persona`, `scenario`, `use-case`, `feature`, `adr`
- Task templates for each stage with default prompts:
  - `templates/task-templates/persona-design.yaml`
  - `templates/task-templates/scenario-design.yaml`
  - `templates/task-templates/use-case-design.yaml`
  - `templates/task-templates/feature-design.yaml`
  - `templates/task-templates/adr-design.yaml`
- Stage skip mechanism ("No changes required" with justification)
- Integration with standard workflow's `design` stage (design workflow creates chains that standard workflow consumes)
- Documentation updates to `DEVELOPMENT_PIPELINE.md`

### Out of Scope

- Modifying ideation workflow (separate concern: idea exploration vs. design execution)
- Modifying standard workflow structure (it already has a design stage that will use these chains)
- Automated artifact generation (prompts guide, agent creates)

---

## Acceptance Criteria

- [ ] `templates/workflow-templates/design.yaml` exists with five stages
- [ ] Each stage references a task template via `taskTemplate` field
- [ ] All five task templates exist with appropriate `defaultPrompt` content
- [ ] Prompts reference correct output locations (e.g., `docs/design/{{domain}}/personas/`)
- [ ] Stage skip mechanism documented (how to mark "No changes required")
- [ ] `DEVELOPMENT_PIPELINE.md` updated to reference design workflow
- [ ] `templates/AGENTS.md` updated with design workflow documentation
- [ ] Example: running design workflow creates chain with 5 tasks in correct sequence

---

## Design Decisions

### Stage Sequence

The sequence follows the user value chain from `DEVELOPMENT_PIPELINE.md`:

```
Persona (WHO) → Scenario (WHAT goal) → Use Case (HOW user accomplishes) → Feature (WHAT we build) → ADR (HOW technically)
```

### Skip Mechanism

Stages can be skipped by:
1. Agent marks task complete with note: "No changes required: [justification]"
2. Gate advances automatically
3. Audit trail preserved in task completion notes

### Relationship to Standard Workflow

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

The design workflow is **invoked by** the standard workflow's design stage, not a replacement for it.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Over-engineering for simple features | Medium | Medium | Skip mechanism allows bypassing stages |
| Prompt drift from actual design doc structure | Low | Medium | Prompts reference canonical docs in `docs/design/` |
| Confusion with ideation workflow | Low | Low | Clear documentation: ideation = exploration, design = execution |

---

## Links

- **Depends on**: CR-20251214-008 (Task Prompt System)
- **Related**: `docs/design/DEVELOPMENT_PIPELINE.md` (defines the value chain)
- **Related**: `templates/workflow-templates/standard.yaml` (design stage consumes these chains)
- **Related**: `templates/workflow-templates/ideation.yaml` (separate workflow, not replaced)

---

## Completion Notes

_To be filled when complete._
