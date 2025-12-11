# Change Request: Coverage Core Infrastructure

**ID**: CR-20251211-008  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Build the foundational infrastructure for the Test Coverage Dashboard: coverage report parsing, data model, threshold configuration, and CLI commands.

---

## Why

Test coverage is the second pillar of the trust layer. While linting verifies structural quality, testing verifies behavioral correctness. This CR establishes the core infrastructure that all subsequent coverage features build upon:

- Parse coverage reports from common test runners (Vitest, Jest)
- Store and query coverage data
- Configure thresholds at global, directory, and file levels
- CLI interface for coverage operations

Without this foundation, there's no programmatic way to verify that agent-generated code is adequately tested.

---

## Scope

**In Scope**:
- `@choragen/core` coverage module (`packages/core/src/coverage/`)
- Coverage report parsing for Vitest and Jest (istanbul format)
- Coverage data model (CoverageReport, FileCoverage, CoverageSummary)
- Configuration loading from `.choragen/coverage.yaml`
- Threshold validation (global, per-directory, per-file)
- Exclusion pattern support
- CLI commands: `choragen coverage`, `choragen coverage:check`, `choragen coverage:gaps`
- Coverage summary output with pass/fail status

**Out of Scope**:
- Web dashboard — CR-20251211-010
- Workflow gate integration — CR-20251211-011
- Test inventory and mapping — CR-20251211-009
- Trend tracking (requires persistence)

---

## Acceptance Criteria

- [ ] Parse Vitest coverage reports (v8/istanbul JSON format)
- [ ] Parse Jest coverage reports (istanbul JSON format)
- [ ] `CoverageReport` data model with file-level metrics
- [ ] Configuration loads from `.choragen/coverage.yaml`
- [ ] Global thresholds for lines, branches, functions, statements
- [ ] Per-directory threshold overrides via glob patterns
- [ ] Per-file threshold overrides via exact match
- [ ] Exclusion patterns to skip files from coverage checks
- [ ] `choragen coverage` shows coverage summary
- [ ] `choragen coverage:check` validates against thresholds, exits non-zero on failure
- [ ] `choragen coverage:gaps` lists uncovered lines by file
- [ ] Coverage percentage calculated correctly (covered/total × 100)

---

## Affected Design Documents

- [Test Coverage Dashboard](../../../design/core/features/test-coverage-dashboard.md)

---

## Linked ADRs

- ADR-013: Test Coverage Dashboard (to be created)

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
packages/core/src/coverage/
├── index.ts                    # Barrel exports
├── types.ts                    # CoverageReport, FileCoverage, etc.
├── parser.ts                   # Coverage report parsing
├── providers/
│   ├── index.ts
│   ├── vitest.ts               # Vitest coverage parser
│   └── jest.ts                 # Jest coverage parser
├── config.ts                   # Configuration loader
├── thresholds.ts               # Threshold validation logic
└── __tests__/
    ├── parser.test.ts
    ├── thresholds.test.ts
    └── config.test.ts
```

CLI commands:
```
packages/cli/src/commands/coverage.ts
packages/cli/src/commands/coverage-check.ts
packages/cli/src/commands/coverage-gaps.ts
```

Coverage report locations (auto-detect):
- Vitest: `coverage/coverage-final.json`
- Jest: `coverage/coverage-final.json`

Configuration example:
```yaml
thresholds:
  global:
    lines: 80
    branches: 75
  overrides:
    - pattern: "packages/core/**"
      lines: 90
    - pattern: "**/*.generated.ts"
      exclude: true
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
