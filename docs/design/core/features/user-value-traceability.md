# Feature: User Value Traceability Validation

**Domain**: core  
**Created**: 2025-12-07  
**Status**: Draft  

---

## Overview

This feature defines the validation rules that enforce traceability from implementation artifacts back to user value. Every artifact in the Choragen pipeline must trace back to a persona who benefits from it. The validator checks each link in the value chain and reports broken connections.

The complete value chain is:

```
Persona → Scenario → Use Case → Feature → CR/FR → ADR → Implementation → Commits
```

The chain is **bi-directional** at the CR/FR ↔ Commits boundary:
- Commits reference CR/FR IDs in their messages
- CR/FR docs list their implementing commits in the `## Commits` section

This validator focuses on the **User Value Layer** links (Persona through Feature) and the **Feature → CR** link. The remaining links are enforced by:
- ADR → CR: `validate-adr-traceability.mjs`
- Source → ADR: `validate-source-adr-references.mjs`
- CR/FR → Commits: `choragen request:close` command

---

## Validation Rules

### Rule 1: Scenario → Persona (with Value Statement)

**Purpose**: Ensure every scenario is grounded in a real user need with explicit value articulation.

| Attribute | Value |
|-----------|-------|
| **What is checked** | Scenario docs in `docs/design/*/scenarios/` have a non-empty "Persona Value" section with value statements |
| **File pattern** | `docs/design/*/scenarios/*.md` |
| **Section name** | `## Persona Value` |

**Pass criteria**:
- Document contains `## Persona Value` section
- Section has at least one persona subsection (`### [Persona Name]`)
- Each persona subsection has a `**Value**:` statement (non-empty)
- Personas may optionally have `**Excluded**:` with justification instead of value

**Fail criteria**:
- Missing `## Persona Value` section entirely
- Section exists but has no persona subsections
- Persona subsection missing both `**Value**:` and `**Excluded**:` statements
- Value/Excluded statements are empty or contain only placeholder text

**Error message format**:
```
❌ [RULE-1] Scenario missing persona value statements
   File: docs/design/core/scenarios/example-workflow.md
   Expected: Non-empty "Persona Value" section with value statements
   Found: Section missing or incomplete
   Fix: Add "## Persona Value" section with persona subsections and value statements
```

---

### Rule 2: Use Case → Scenario

**Purpose**: Ensure every use case fulfills part of a user scenario.

| Attribute | Value |
|-----------|-------|
| **What is checked** | Use case docs in `docs/design/*/use-cases/` have a non-empty "Related Scenarios" section |
| **File pattern** | `docs/design/*/use-cases/*.md` |
| **Section name** | `## Related Scenarios` or `## Linked Scenarios` |

**Pass criteria**:
- Document contains `## Related Scenarios` or `## Linked Scenarios` section
- Section has at least one list item (`- `) after the heading
- List item contains a link to a scenario file (`../scenarios/`) or scenario name

**Fail criteria**:
- Missing both `## Related Scenarios` and `## Linked Scenarios` sections
- Section exists but is empty (no list items)
- Section only contains placeholder text

**Error message format**:
```
❌ [RULE-2] Use case missing linked scenario
   File: docs/design/core/use-cases/bootstrap-project.md
   Expected: Non-empty "Related Scenarios" or "Linked Scenarios" section
   Found: Section missing or empty
   Fix: Add "## Related Scenarios" section with at least one scenario reference
```

---

### Rule 3: Feature → Scenario or Use Case

**Purpose**: Ensure every feature enables at least one user scenario or use case.

| Attribute | Value |
|-----------|-------|
| **What is checked** | Feature docs in `docs/design/*/features/` have a non-empty "Linked Scenarios" OR "Linked Use Cases" section |
| **File pattern** | `docs/design/*/features/*.md` |
| **Section names** | `## Linked Scenarios` or `## Linked Use Cases` (at least one required) |

**Pass criteria**:
- Document contains `## Linked Scenarios` with at least one list item, OR
- Document contains `## Linked Use Cases` with at least one list item, OR
- Document contains both sections with at least one having content

**Fail criteria**:
- Missing both `## Linked Scenarios` and `## Linked Use Cases` sections
- Both sections exist but are empty
- Sections only contain placeholder text like `{{SCENARIO_1}}`

**Error message format**:
```
❌ [RULE-3] Feature missing linked scenario or use case
   File: docs/design/core/features/new-feature.md
   Expected: Non-empty "Linked Scenarios" or "Linked Use Cases" section
   Found: Neither section present or both empty
   Fix: Add "## Linked Scenarios" or "## Linked Use Cases" with at least one reference
```

---

### Rule 4: CR → Feature

**Purpose**: Ensure every change request implements at least one feature.

| Attribute | Value |
|-----------|-------|
| **What is checked** | CR docs in `docs/requests/change-requests/` have a non-empty "Affected Design Documents" section that includes at least one feature doc |
| **File pattern** | `docs/requests/change-requests/*/*.md` (todo/, doing/, done/) |
| **Section name** | `## Affected Design Documents` |

**Pass criteria**:
- Document contains `## Affected Design Documents` section
- Section has at least one list item (`- `) after the heading
- At least one list item references a feature doc (`docs/design/*/features/` or `features/`)

**Fail criteria**:
- Missing `## Affected Design Documents` section
- Section exists but is empty
- Section has content but no feature doc references (only scenarios, use cases, or other docs)
- Section only contains placeholder text like `{{DESIGN_DOC_1}}`

**Error message format**:
```
❌ [RULE-4] CR missing linked feature document
   File: docs/requests/change-requests/doing/CR-20251207-001-add-auth.md
   Expected: "Affected Design Documents" section with at least one feature doc reference
   Found: Section missing, empty, or no feature docs referenced
   Fix: Add feature doc reference to "## Affected Design Documents" section
```

---

### Rule 5: ADR → CR/FR (Existing)

**Status**: Already enforced by `validate-adr-traceability.mjs`

| Attribute | Value |
|-----------|-------|
| **What is checked** | ADRs in `docs/adr/doing/` and `docs/adr/done/` reference a CR or FR |
| **Validator** | `scripts/validate-adr-traceability.mjs` |

---

### Rule 6: Source → ADR (Existing)

**Status**: Already enforced by `validate-source-adr-references.mjs`

| Attribute | Value |
|-----------|-------|
| **What is checked** | Source files in `packages/` have ADR reference comments |
| **Validator** | `scripts/validate-source-adr-references.mjs` |

---

## Validation Order

Rules are validated in **reverse chain order** (from implementation toward user value):

```
Order   Rule   Link                    Rationale
─────   ────   ────                    ─────────
1       6      Source → ADR            Already enforced (existing validator)
2       5      ADR → CR/FR             Already enforced (existing validator)
3       4      CR → Feature            Validates solution layer entry point
4       3      Feature → Scenario/UC   Validates solution-to-value connection
5       2      Use Case → Scenario     Validates use case grounding
6       1      Scenario → Persona      Validates ultimate user value
```

**Rationale for reverse order**:
- Most common failures are at the implementation end (missing ADR refs)
- Developers see immediate feedback on their recent work
- User value layer issues are less frequent but more fundamental

---

## Rule Composition

### Independent Validation

Each rule runs independently. A failure in one rule does not prevent other rules from running.

### Aggregated Results

All rules run to completion, then results are aggregated:

```
┌─────────────────────────────────────────────────────────────┐
│ User Value Traceability Validation Results                  │
├─────────────────────────────────────────────────────────────┤
│ Rule 1 (Scenario → Persona):     ✅ 2/2 passed              │
│ Rule 2 (Use Case → Scenario):    ⚠️  4/5 passed (1 warning) │
│ Rule 3 (Feature → Scenario/UC):  ✅ 9/9 passed              │
│ Rule 4 (CR → Feature):           ❌ 2/3 passed (1 error)    │
├─────────────────────────────────────────────────────────────┤
│ Summary: 1 error, 1 warning                                 │
└─────────────────────────────────────────────────────────────┘
```

### Error vs Warning Classification

| Severity | Condition | Exit Code |
|----------|-----------|-----------|
| **Error** | CR missing feature link (Rule 4) | 1 |
| **Error** | Feature missing scenario/use case link (Rule 3) | 1 |
| **Warning** | Use case missing scenario link (Rule 2) | 0 |
| **Warning** | Scenario missing persona link (Rule 1) | 0 |

**Rationale**:
- Rules 3-4 are **errors** because they break the solution-to-value connection
- Rules 1-2 are **warnings** because the user value layer is still being established
- This allows incremental adoption while enforcing critical links

### Partial Chain Validation

If Rule 4 fails but Rule 3 passes, both are reported:

```
❌ [RULE-4] CR missing linked feature document
   File: docs/requests/change-requests/doing/CR-20251207-001.md
   ...

✅ [RULE-3] All features have linked scenarios or use cases (9/9)
```

The validator continues checking all rules regardless of earlier failures.

---

## Exceptions

Not every artifact traces to user value, and that's acceptable—but it must be explicit and justified. This section defines how to handle legitimate exceptions to traceability requirements.

### What Can Be Exempted

| Artifact Type | Exemptable? | Rationale |
|---------------|-------------|-----------|
| **Source files** | ✅ Yes | Tooling, utilities, build scripts don't serve users directly |
| **Design docs** | ✅ Yes | Framework docs (like this pipeline doc) are meta-documentation |
| **CRs/FRs** | ✅ Yes | Infrastructure work may not trace to features |
| **ADRs** | ⚠️ Partial | Can exempt from feature link, but must still link to CR/FR |
| **Scenarios** | ❌ No | Scenarios ARE user value—they cannot be exempt |
| **Personas** | ❌ No | Personas ARE user value—they cannot be exempt |
| **Use Cases** | ❌ No | Use cases ARE user value—they cannot be exempt |

**Principle**: Artifacts in the User Value Layer (Persona, Scenario, Use Case) cannot be exempted because they define user value itself. Artifacts in the Solution Layer can be exempted when they support the system without directly serving users.

### Exemption Categories

Artifacts that commonly qualify for exemption:

| Category | Examples | Default Exemption |
|----------|----------|-------------------|
| **CI/CD** | `.github/workflows/`, `Dockerfile`, deployment configs | Pattern-based |
| **Build tooling** | `scripts/`, `eslint.config.mjs`, `tsconfig.json` | Pattern-based |
| **Internal utilities** | Test helpers, shared constants, type definitions | Inline marker |
| **Framework documentation** | `DEVELOPMENT_PIPELINE.md`, `AGENTS.md` | Inline marker |
| **Generated code** | Type definitions from schemas, compiled outputs | Pattern-based |

### Exemption Mechanism

Exemptions use a **hybrid approach**: pattern-based exemptions for entire categories, and inline markers for individual files.

#### Pattern-Based Exemptions

Configure in `choragen.governance.yaml`:

```yaml
validation:
  user-value-traceability:
    exempt-patterns:
      # Build and tooling
      - pattern: "scripts/**/*.mjs"
        category: "build-tooling"
        justification: "Build scripts support development but don't serve users directly"
      
      # CI/CD configuration
      - pattern: ".github/**/*"
        category: "ci-cd"
        justification: "CI/CD configuration is infrastructure"
      
      # Generated files
      - pattern: "**/generated/**/*"
        category: "generated"
        justification: "Generated code traces to its generator, not user value"
      
      # Framework documentation
      - pattern: "docs/design/DEVELOPMENT_PIPELINE.md"
        category: "framework-docs"
        justification: "Meta-documentation about the pipeline itself"
```

**Required fields**:
- `pattern`: Glob pattern matching files to exempt
- `category`: One of: `build-tooling`, `ci-cd`, `generated`, `framework-docs`, `internal-utility`, `legacy`
- `justification`: Human-readable explanation of why this pattern is exempt

#### Inline Exemption Markers

For individual files that don't fit a pattern, use inline markers:

**Source files** (TypeScript/JavaScript):
```typescript
/**
 * @exempt user-value-traceability
 * @exempt-category internal-utility
 * @exempt-reason Shared type definitions used across features
 */
```

**Markdown files**:
```markdown
<!-- @exempt user-value-traceability -->
<!-- @exempt-category framework-docs -->
<!-- @exempt-reason This document describes the development process itself -->
```

**YAML/Config files**:
```yaml
# @exempt user-value-traceability
# @exempt-category build-tooling
# @exempt-reason ESLint configuration for code quality
```

**Required marker fields**:
- `@exempt user-value-traceability`: Declares the exemption
- `@exempt-category <category>`: Must be a valid category
- `@exempt-reason <text>`: Justification (required, cannot be empty)

### Justification Requirements

All exemptions require justification. The justification must:

1. **Be non-empty**: Placeholder text like "TODO" or "TBD" is rejected
2. **Be specific**: Generic reasons like "not needed" are rejected
3. **Reference the category**: Explain why this artifact fits the exemption category

**Valid justifications**:
- "Build script for running validators—supports development workflow"
- "Type definitions shared across all packages—no single feature owns these"
- "CI workflow for automated testing—infrastructure, not user-facing"

**Invalid justifications**:
- "Exempt" (no explanation)
- "Internal" (too vague)
- "TODO: add justification later" (placeholder)

### Grandfathering Strategy

Existing code that predates traceability enforcement uses a **gradual enforcement** approach:

#### Phase 1: Baseline Date (Immediate)

All artifacts created before the baseline date are automatically exempt:

```yaml
validation:
  user-value-traceability:
    baseline-date: "2025-12-07"  # Date traceability enforcement begins
    pre-baseline-behavior: "warn"  # warn | skip | error
```

- `warn`: Report missing traceability as warnings (non-blocking)
- `skip`: Silently skip pre-baseline files
- `error`: Enforce traceability even for pre-baseline files

**Baseline detection**: Uses git history to determine file creation date. Files created before the baseline date are flagged as pre-baseline.

#### Phase 2: Legacy Markers (Transition)

For pre-baseline files that need updates, add a `@legacy` marker:

```typescript
/**
 * @legacy user-value-traceability
 * @legacy-reason Pre-dates traceability requirements (created 2025-01-15)
 * @legacy-plan Will be updated when feature X is refactored
 */
```

Legacy markers:
- Convert errors to warnings for that file
- Require a plan for eventual compliance
- Are tracked in exemption audits

#### Phase 3: Full Enforcement (Future)

After a transition period, legacy markers expire:

```yaml
validation:
  user-value-traceability:
    legacy-expiry: "2026-01-01"  # Date legacy markers stop being honored
```

After expiry, legacy-marked files are treated as errors unless they've been updated with proper traceability or converted to permanent exemptions.

### Exemption Audit

All exemptions are auditable. The validator can list all exemptions:

```bash
# List all exemptions
choragen validate:user-value --list-exemptions

# Output format:
# ┌─────────────────────────────────────────────────────────────────────┐
# │ User Value Traceability Exemptions                                   │
# ├─────────────────────────────────────────────────────────────────────┤
# │ Pattern-Based Exemptions (from choragen.governance.yaml)             │
# │   scripts/**/*.mjs          build-tooling     12 files              │
# │   .github/**/*              ci-cd             8 files               │
# ├─────────────────────────────────────────────────────────────────────┤
# │ Inline Exemptions                                                    │
# │   packages/core/src/types.ts    internal-utility                    │
# │   docs/design/PIPELINE.md       framework-docs                      │
# ├─────────────────────────────────────────────────────────────────────┤
# │ Legacy Markers                                                       │
# │   packages/cli/src/old-cmd.ts   expires: 2026-01-01                 │
# ├─────────────────────────────────────────────────────────────────────┤
# │ Pre-Baseline Files (created before 2025-12-07)                       │
# │   47 files (use --show-pre-baseline for full list)                  │
# └─────────────────────────────────────────────────────────────────────┘
```

**Audit capabilities**:
- List all exemptions by category
- Show file counts per pattern
- Track legacy marker expiry dates
- Identify pre-baseline files pending migration

### Exemption Validation Rules

The validator enforces exemption correctness:

| Check | Severity | Description |
|-------|----------|-------------|
| Missing justification | Error | Exemption marker without `@exempt-reason` |
| Invalid category | Error | Category not in allowed list |
| Placeholder justification | Error | Justification contains "TODO", "TBD", etc. |
| Expired legacy marker | Error | Legacy marker past expiry date |
| Orphaned pattern | Warning | Pattern in config matches no files |
| Duplicate exemption | Warning | File matches both pattern and has inline marker |

---

## Configuration

### Severity Override

Projects can override severity in `choragen.governance.yaml`:

```yaml
validation:
  user-value-traceability:
    # Promote warnings to errors for strict enforcement
    scenario-persona: error      # Default: warning
    usecase-scenario: error      # Default: warning
    feature-scenario: error      # Default: error
    cr-feature: error            # Default: error
```

### Skip Patterns

Certain files can be excluded from validation:

```yaml
validation:
  user-value-traceability:
    skip:
      - "docs/design/*/features/README.md"
      - "docs/design/*/scenarios/_template.md"
```

---

## Acceptance Criteria

### Validation Rules
- [ ] Rule 1: Scenario docs are validated for "Linked Personas" section
- [ ] Rule 2: Use case docs are validated for "Related Scenarios" section
- [ ] Rule 3: Feature docs are validated for "Linked Scenarios" or "Linked Use Cases"
- [ ] Rule 4: CR docs are validated for "Affected Design Documents" with feature refs
- [ ] Validation runs in reverse chain order
- [ ] All rules run independently (one failure doesn't stop others)
- [ ] Error messages include file path, expected, found, and fix instructions
- [ ] Exit code 1 if any errors, 0 if only warnings
- [ ] Configuration allows severity override and skip patterns

### Exception Handling
- [ ] Pattern-based exemptions are honored from `choragen.governance.yaml`
- [ ] Inline `@exempt` markers are recognized in source, markdown, and config files
- [ ] Exemptions require valid category and non-empty justification
- [ ] Invalid exemptions (missing justification, bad category) produce errors
- [ ] Pre-baseline files are detected via git history and handled per config
- [ ] Legacy markers convert errors to warnings until expiry date
- [ ] Expired legacy markers produce errors
- [ ] `--list-exemptions` flag outputs all exemptions in audit format
- [ ] Personas, Scenarios, and Use Cases cannot be exempted (validation error if attempted)

---

## Linked Scenarios

- [Control Agent Workflow](../scenarios/control-agent-workflow.md)
- [Implementation Agent Workflow](../scenarios/implementation-agent-workflow.md)

---

## Linked Use Cases

- [Create and Execute Task Chain](../use-cases/create-execute-task-chain.md)
- [Review and Approve Work](../use-cases/review-approve-work.md)

---

## Linked ADRs

- [ADR-001: Task File Format](../../../adr/done/ADR-001-task-file-format.md)

---

## Implementation

[Added when implemented]

- `scripts/validate-user-value-traceability.mjs`

---

## Acceptance Tests

[Added when tests written]

- Scenario with missing persona link → warning
- Use case with missing scenario link → warning
- Feature with missing scenario/use case link → error
- CR with missing feature link → error
- All links present → pass
