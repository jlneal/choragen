# Feature: Universal Artifact Linting

**Domain**: core  
**Created**: 2025-12-11  
**Status**: draft  

---

## Overview

Universal Artifact Linting provides comprehensive validation for all project artifacts—documentation, source code, tests, configuration, and generated outputs. It forms the **trust layer** that enables generated artifacts to be accepted without human review.

The core premise: if governance controls *what* agents can do, linting verifies *how well* they did it. Together, they create a closed loop where machine-verified artifacts can be trusted.

```
Governance (access control) + Linting (quality verification) = Trust
```

When both pass at 100%, human review becomes optional.

---

## Capabilities

### Artifact Discovery

- Scan project to identify all artifact types present
- Classify artifacts by category (process docs, design docs, source, tests, config)
- Detect file patterns and infer artifact types
- Build a registry of artifact types with metadata

### Rule Catalog

- Maintain a catalog of lint rules per artifact type
- Rules organized by category (structure, traceability, format, semantics)
- Built-in rules for Choragen artifacts (CRs, ADRs, chains, tasks)
- Integration with existing linters (ESLint, TypeScript, etc.) for code artifacts
- Custom rule definitions for project-specific needs

### Configuration Interface

- Web UI showing artifact types and applicable rules
- Enable/disable rules per artifact type
- Adjust severity (error, warning, off)
- Configure rule parameters
- Project-level, directory-level, and file-level overrides
- Suppression management (inline, file, project)

### Violation Review

- Live scan results with filtering and grouping
- Violation details with context and suggested fixes
- Batch operations (fix all, suppress all of type)
- Diff view for auto-fixable violations
- History of violations over time

### Trust Scoring

- Aggregate compliance metrics per artifact type
- Overall project trust score
- Trend visualization over time
- Integration with workflow gates (block advancement on lint failure)

---

## Architecture

### Artifact Type Registry

```typescript
interface ArtifactType {
  id: string;                    // e.g., "change-request", "typescript-source"
  name: string;                  // Human-readable name
  category: ArtifactCategory;    // process-doc | design-doc | source | test | config | generated
  patterns: string[];            // Glob patterns to match files
  parser: string;                // Parser to use (markdown, typescript, json, yaml)
  rules: string[];               // Rule IDs that apply to this type
}

type ArtifactCategory = 
  | "process-doc"    // CRs, FRs, ADRs, chains, tasks
  | "design-doc"     // Scenarios, features, use cases
  | "source"         // TypeScript, JavaScript, etc.
  | "test"           // Test files
  | "config"         // package.json, tsconfig.json, etc.
  | "generated";     // Build outputs, compiled assets
```

### Rule Definition

```typescript
interface LintRule {
  id: string;                    // e.g., "cr/required-sections"
  name: string;                  // Human-readable name
  description: string;           // What the rule checks
  category: RuleCategory;        // structure | traceability | format | semantics
  severity: "error" | "warning"; // Default severity
  appliesTo: string[];           // Artifact type IDs
  check: (artifact: Artifact, context: LintContext) => LintResult[];
  fix?: (artifact: Artifact, violation: LintViolation) => Fix;
}

interface LintViolation {
  ruleId: string;
  severity: "error" | "warning";
  message: string;
  file: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  fix?: Fix;
  suggestions?: Suggestion[];
}
```

### Rule Categories

| Category | Focus | Examples |
|----------|-------|----------|
| **Structure** | Required sections, fields, format | CR must have What/Why/Scope sections |
| **Traceability** | Cross-references, linking | ADR must link to CR/FR |
| **Format** | Naming, dates, IDs | ID must match `CR-YYYYMMDD-NNN` pattern |
| **Semantics** | Logical consistency, state | CR in `doing/` must have a chain |

### Built-in Rules by Artifact Type

#### Change Requests (CRs)
- `cr/required-sections` — Must have What, Why, Scope, Acceptance Criteria
- `cr/valid-id-format` — ID matches `CR-YYYYMMDD-NNN`
- `cr/status-location-match` — File location matches status field
- `cr/has-feature-link` — Must link to at least one feature doc
- `cr/doing-has-chain` — CRs in `doing/` must have an associated chain
- `cr/done-has-commits` — CRs in `done/` must list commits

#### Architecture Decision Records (ADRs)
- `adr/required-sections` — Must have Context, Decision, Consequences
- `adr/valid-id-format` — ID matches `ADR-NNN`
- `adr/has-cr-link` — Must link to triggering CR/FR
- `adr/has-design-link` — Must link to design document
- `adr/status-location-match` — File location matches status

#### Task Chains
- `chain/valid-id-format` — ID matches `CHAIN-NNN-slug`
- `chain/has-request-link` — Must link to CR/FR
- `chain/tasks-exist` — Referenced tasks must exist
- `chain/no-orphan-tasks` — All tasks in chain dir belong to chain

#### Tasks
- `task/required-sections` — Must have Objective, Acceptance Criteria
- `task/valid-id-format` — ID matches pattern
- `task/has-chain` — Must belong to a chain
- `task/type-valid` — Type must be `impl` or `control`
- `task/done-has-completion` — Done tasks must have completion notes

#### Feature Docs
- `feature/required-sections` — Must have Overview, Capabilities, User Stories
- `feature/has-scenario-link` — Must link to at least one scenario
- `feature/acceptance-criteria` — Must have testable acceptance criteria

#### TypeScript Source
- `ts/eslint-pass` — Must pass ESLint with project config
- `ts/typecheck-pass` — Must pass TypeScript type checking
- `ts/has-adr-reference` — Files in governed paths should reference ADR
- `ts/no-magic-numbers` — Use HttpStatus enum, not literals
- `ts/design-contract` — API routes must use DesignContract

#### Test Files
- `test/has-design-doc-ref` — Test files should reference design doc
- `test/coverage-threshold` — Must meet coverage threshold
- `test/no-skipped` — No `.skip()` in committed tests
- `test/assertions-present` — Tests must have assertions

### Configuration Schema

```yaml
# .choragen/lint.yaml
extends: "choragen:recommended"

artifactTypes:
  # Override or add artifact types
  custom-doc:
    patterns: ["docs/custom/**/*.md"]
    parser: markdown
    rules:
      - custom/my-rule

rules:
  # Override rule settings
  cr/required-sections:
    severity: error
  cr/has-feature-link:
    severity: warning
  ts/no-magic-numbers:
    severity: error
    options:
      allow: [0, 1, -1]

overrides:
  # Directory-level overrides
  - files: ["docs/archive/**"]
    rules:
      cr/status-location-match: off
  
  # File-level overrides
  - files: ["**/legacy/**"]
    rules:
      ts/has-adr-reference: off
```

### Integration Points

#### Workflow Gates

```typescript
// In workflow gate configuration
{
  type: "verification_pass",
  commands: ["choragen lint --stage=implementation"]
}
```

The `--stage` flag filters to rules relevant for the current workflow stage.

#### CLI Commands

```bash
# Full project lint
choragen lint

# Lint specific artifact types
choragen lint --type=change-request

# Lint specific files
choragen lint docs/requests/change-requests/doing/*.md

# Auto-fix where possible
choragen lint --fix

# Output formats
choragen lint --format=json
choragen lint --format=sarif  # For IDE integration

# Stage-scoped lint (for workflow gates)
choragen lint --stage=implementation
```

#### Web Dashboard

- `/lint` — Overview dashboard with trust score
- `/lint/artifacts` — Artifact type registry with rule assignments
- `/lint/rules` — Rule catalog with configuration
- `/lint/violations` — Current violations with filtering
- `/lint/history` — Violation trends over time

### Trust Score Calculation

```typescript
interface TrustScore {
  overall: number;           // 0-100
  byCategory: {
    processDocs: number;
    designDocs: number;
    source: number;
    tests: number;
    config: number;
  };
  byArtifactType: Record<string, number>;
  trend: "improving" | "stable" | "declining";
}

// Score = (passing artifacts / total artifacts) × 100
// Weighted by severity: errors count more than warnings
```

---

## User Stories

### As a Human Operator

I want to see all lint violations in the project at a glance  
So that I can assess the overall health and trustworthiness of artifacts

### As a Human Operator

I want to configure which rules apply to which artifact types  
So that I can tune the linting to my project's conventions

### As a Human Operator

I want lint failures to block workflow advancement  
So that I can trust that completed work meets quality standards

### As an AI Agent

I want clear lint error messages with fix suggestions  
So that I can correct violations without human intervention

### As an AI Agent

I want to know which rules apply before generating an artifact  
So that I can produce compliant output on the first attempt

---

## Acceptance Criteria

- [ ] Artifact discovery scans project and identifies all artifact types
- [ ] Built-in rules exist for all Choragen artifact types (CR, FR, ADR, chain, task, feature, scenario)
- [ ] ESLint/TypeScript integration for source code artifacts
- [ ] Web UI displays artifact types with applicable rules
- [ ] Rules can be enabled/disabled per artifact type
- [ ] Rule severity can be configured (error/warning/off)
- [ ] Violations display with file, line, message, and suggested fix
- [ ] Auto-fix available for fixable violations
- [ ] CLI command `choragen lint` runs full project lint
- [ ] Workflow gates can require lint pass before advancement
- [ ] Trust score calculated and displayed on dashboard
- [ ] Configuration via `.choragen/lint.yaml`
- [ ] Inline suppression comments supported

---

## Linked ADRs

- ADR-012: Universal Artifact Linting (to be created)

---

## Linked Scenarios

- [Human-Driven Development](../scenarios/human-driven-development.md) — Linting enables trust in agent-generated artifacts

---

## Linked Use Cases

- UC-001: Validate CR before workflow advancement
- UC-002: Configure project-specific lint rules
- UC-003: Review and fix lint violations in batch

---

## Implementation

[Added when implemented]

### Phase 1: Core Infrastructure
- Artifact type registry
- Rule definition framework
- Built-in rules for process docs (CR, FR, ADR)
- CLI `choragen lint` command

### Phase 2: Source Code Integration
- ESLint integration
- TypeScript integration
- Test file rules

### Phase 3: Web Dashboard
- Artifact type browser
- Rule configuration UI
- Violation review interface
- Trust score display

### Phase 4: Workflow Integration
- Lint gates in workflow templates
- Stage-scoped linting
- Auto-fix in agent sessions

---

## Acceptance Tests

[Added when tests written]

- `packages/core/src/lint/__tests__/artifact-discovery.test.ts`
- `packages/core/src/lint/__tests__/rule-engine.test.ts`
- `packages/core/src/lint/__tests__/builtin-rules.test.ts`
- `packages/cli/src/__tests__/lint-command.test.ts`
- `packages/web/src/__tests__/lint-dashboard.test.ts`

---

## Design Decisions

### Custom Rules: JavaScript Functions

Custom rules are defined as JavaScript/TypeScript modules. This provides full programmatic power for complex validation logic. The complexity is acceptable because:

1. **Agents write rules, not humans** — Users describe what they want in natural language; agents encode it as JS
2. **The abstraction is the chat interface** — Users interact via conversation, not code
3. **Maximum expressiveness** — No artificial limits on what rules can check

```typescript
// .choragen/rules/my-custom-rule.ts
import { defineRule } from "@choragen/lint";

export default defineRule({
  id: "custom/require-rationale",
  name: "Require Rationale Section",
  appliesTo: ["change-request"],
  check(artifact) {
    if (!artifact.sections.includes("Rationale")) {
      return [{ message: "CR must include a Rationale section" }];
    }
    return [];
  },
});
```

### Scan Modes: Full and Incremental

Both modes are supported via CLI flags:

```bash
choragen lint              # Full project scan
choragen lint --changed    # Only files changed since last commit
choragen lint --staged     # Only staged files (for pre-commit)
```

- **Full scan**: CI pipelines, workflow gates, on-demand audits
- **Incremental**: Development workflow, file-save hooks, speed-critical paths

### IDE Integration: Future Scope

The web dashboard is the primary interface. IDE integration via LSP is a future enhancement after the core system is stable.

### Severity: Full Project Control

Projects can adjust severity in either direction (upgrade or downgrade):

```yaml
rules:
  cr/has-feature-link:
    severity: error    # Upgrade from default warning
  ts/no-magic-numbers:
    severity: warning  # Downgrade from default error
```

**Philosophy**: The goal is to make every rule an `error`. Errors provide the highest level of trust. Warnings are transitional — they represent rules you haven't committed to yet. A mature project should have zero warnings because everything is either enforced (error) or explicitly disabled (off).

### Cross-Artifact Rules: Two-Phase Linting

Rules that span multiple artifacts use a graph-based approach:

**Phase 1: Single-Artifact Rules**
Each file is linted in isolation. Fast, parallelizable. Builds the artifact graph.

**Phase 2: Cross-Artifact Rules**
After all artifacts are parsed, rules query the full graph:

```typescript
import { defineCrossArtifactRule } from "@choragen/lint";

export default defineCrossArtifactRule({
  id: "cr/doing-has-chain",
  name: "CRs in doing must have a chain",
  check(graph) {
    const violations = [];
    for (const cr of graph.getArtifacts("change-request")) {
      if (cr.status === "doing" && !graph.getLinkedChain(cr.id)) {
        violations.push({
          file: cr.file,
          message: `CR ${cr.id} is in doing/ but has no associated chain`,
        });
      }
    }
    return violations;
  },
});
```

The `ArtifactGraph` provides typed access to all artifacts and their relationships, enabling complex cross-reference validation.
