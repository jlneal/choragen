# Change Request: Lint Core Infrastructure

**ID**: CR-20251211-004  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Build the foundational infrastructure for Universal Artifact Linting: artifact type registry, rule engine, built-in rules for process documents, and CLI command.

---

## Why

Universal Artifact Linting is the trust layer that enables generated artifacts to be accepted without human review. This CR establishes the core infrastructure that all subsequent linting features build upon:

- Artifact discovery and classification
- Rule definition and execution framework
- Initial set of rules for Choragen's own artifacts (CRs, FRs, ADRs, chains, tasks)
- CLI interface for running lint checks

Without this foundation, there's no programmatic way to verify that agent-generated artifacts meet quality standards.

---

## Scope

**In Scope**:
- `@choragen/core` lint module (`packages/core/src/lint/`)
- Artifact type registry with discovery from file patterns
- Rule engine supporting single-artifact and cross-artifact rules
- `defineRule()` and `defineCrossArtifactRule()` helper functions
- Built-in rules for process docs:
  - CR: required sections, valid ID, status-location match, has-feature-link, doing-has-chain, done-has-commits
  - FR: required sections, valid ID, severity field
  - ADR: required sections, valid ID, has-cr-link, has-design-link
  - Chain: valid ID, has-request-link, tasks-exist
  - Task: required sections, valid ID, has-chain, type-valid, done-has-completion
- Configuration loading from `.choragen/lint.yaml`
- Custom rule loading from `.choragen/rules/`
- CLI command: `choragen lint` with `--changed`, `--staged`, `--format` flags
- Violation output with file, line, message, severity

**Out of Scope**:
- Source code linting (ESLint/TypeScript integration) — CR-20251211-005
- Web dashboard — CR-20251211-006
- Workflow gate integration — CR-20251211-007
- Auto-fix functionality (future enhancement)

---

## Acceptance Criteria

- [ ] `ArtifactTypeRegistry` discovers and classifies project artifacts
- [ ] `RuleEngine` executes single-artifact rules in parallel
- [ ] `RuleEngine` executes cross-artifact rules after graph is built
- [ ] `defineRule()` creates single-artifact rule definitions
- [ ] `defineCrossArtifactRule()` creates cross-artifact rule definitions
- [ ] Built-in rules exist for CR, FR, ADR, chain, task artifacts
- [ ] Configuration loads from `.choragen/lint.yaml`
- [ ] Custom rules load from `.choragen/rules/*.ts`
- [ ] `choragen lint` runs full project scan
- [ ] `choragen lint --changed` scans only changed files
- [ ] `choragen lint --staged` scans only staged files
- [ ] `choragen lint --format=json` outputs JSON for tooling
- [ ] Exit code is non-zero when errors exist
- [ ] Violations display file path, line number, rule ID, message, severity

---

## Affected Design Documents

- [Universal Artifact Linting](../../../design/core/features/universal-artifact-linting.md)

---

## Linked ADRs

- ADR-012: Universal Artifact Linting (to be created)

---

## Dependencies

- None

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create:

```
packages/core/src/lint/
├── index.ts                    # Barrel exports
├── types.ts                    # ArtifactType, LintRule, LintViolation, etc.
├── registry.ts                 # ArtifactTypeRegistry
├── engine.ts                   # RuleEngine (single + cross-artifact)
├── graph.ts                    # ArtifactGraph for cross-artifact rules
├── config.ts                   # Configuration loader
├── define.ts                   # defineRule(), defineCrossArtifactRule()
├── rules/                      # Built-in rules
│   ├── index.ts
│   ├── cr.ts                   # Change request rules
│   ├── fr.ts                   # Fix request rules
│   ├── adr.ts                  # ADR rules
│   ├── chain.ts                # Chain rules
│   └── task.ts                 # Task rules
└── __tests__/
    ├── registry.test.ts
    ├── engine.test.ts
    ├── graph.test.ts
    └── rules/
        └── *.test.ts
```

CLI command:
```
packages/cli/src/commands/lint.ts
```

The rule engine should:
1. Discover all artifacts matching registered patterns
2. Parse each artifact with appropriate parser (markdown, yaml, etc.)
3. Run single-artifact rules in parallel
4. Build artifact graph from parsed artifacts
5. Run cross-artifact rules on the graph
6. Collect and sort violations
7. Output in requested format

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
