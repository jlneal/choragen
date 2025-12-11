# Feature: Test Coverage Dashboard

**Domain**: core  
**Created**: 2025-12-11  
**Status**: draft  

---

## Overview

The Test Coverage Dashboard provides comprehensive visibility, control, and enforcement for test coverage across all project artifacts. It complements Universal Artifact Linting as the second pillar of the trust layer.

```
Trust = Lint (well-formed) × Tests (correct behavior)
```

Just as linting verifies structural quality, testing verifies behavioral correctness. Both must pass at high levels for generated artifacts to be trusted without human review.

The dashboard enables:
- **Monitoring** — Real-time coverage metrics across the codebase
- **Control** — Configure thresholds, required test patterns, enforcement rules
- **Tuning** — Adjust coverage requirements per module, file, or artifact type
- **Enforcement** — Workflow gates that block advancement on coverage failures

---

## Capabilities

### Coverage Monitoring

- Real-time coverage metrics from test runs
- Line, branch, function, and statement coverage
- Coverage by package, directory, file, and function
- Trend visualization over time
- Diff coverage for changed files (what % of changes are tested)
- Uncovered lines highlighted with source context

### Coverage Configuration

- Global coverage thresholds (line, branch, function, statement)
- Per-directory threshold overrides
- Per-file threshold overrides
- Exclusion patterns (files that don't need coverage)
- Required test patterns (e.g., "every API route must have integration test")
- Test naming conventions enforcement

### Test Inventory

- Catalog of all test files with metadata
- Test-to-source mapping (which tests cover which files)
- Orphan detection (source files with no tests)
- Test type classification (unit, integration, e2e)
- Design doc references in tests
- Skipped/pending test tracking

### Coverage Enforcement

- Workflow gates requiring minimum coverage
- PR-level coverage checks (new code must meet threshold)
- Coverage regression detection (alert if coverage drops)
- Required test existence rules (e.g., "every feature must have acceptance tests")

### Agent Integration

- Agents can query coverage before completing work
- Coverage gaps surfaced as actionable items
- Test generation suggestions based on uncovered code
- `test_coverage` tool for agent self-verification

---

## Architecture

### Coverage Data Model

```typescript
interface CoverageReport {
  timestamp: Date;
  summary: CoverageSummary;
  files: Map<string, FileCoverage>;
  packages: Map<string, PackageCoverage>;
}

interface CoverageSummary {
  lines: CoverageMetric;
  branches: CoverageMetric;
  functions: CoverageMetric;
  statements: CoverageMetric;
}

interface CoverageMetric {
  total: number;
  covered: number;
  percentage: number;
}

interface FileCoverage {
  path: string;
  lines: CoverageMetric;
  branches: CoverageMetric;
  functions: CoverageMetric;
  statements: CoverageMetric;
  uncoveredLines: number[];
  uncoveredBranches: BranchLocation[];
}

interface TestFile {
  path: string;
  type: "unit" | "integration" | "e2e";
  designDocRef?: string;
  sourceFiles: string[];      // Files this test covers
  testCount: number;
  skippedCount: number;
  passingCount: number;
  failingCount: number;
}
```

### Configuration Schema

```yaml
# .choragen/coverage.yaml
thresholds:
  global:
    lines: 80
    branches: 75
    functions: 80
    statements: 80
  
  overrides:
    # Higher threshold for core packages
    - pattern: "packages/core/src/**"
      lines: 90
      branches: 85
    
    # Lower threshold for UI components
    - pattern: "packages/web/src/components/**"
      lines: 70
      branches: 60
    
    # Exclude generated files
    - pattern: "**/*.generated.ts"
      exclude: true

requiredTests:
  # Every API route must have integration test
  - source: "packages/web/src/app/api/**/*.ts"
    test: "packages/web/src/__tests__/api/**/*.test.ts"
    type: integration
  
  # Every feature must have acceptance tests
  - source: "packages/core/src/**/*.ts"
    test: "packages/core/src/**/__tests__/*.test.ts"
    type: unit

testPatterns:
  # Test files must reference design docs
  designDocRequired: true
  designDocPattern: "@design-doc"
  
  # No skipped tests in main branch
  allowSkipped: false
  
  # Test naming convention
  namePattern: "*.test.ts"
```

### Integration Points

#### Coverage Providers

Support multiple coverage tools:
- **Vitest** — Native coverage via v8/istanbul
- **Jest** — Coverage via istanbul
- **c8** — V8 coverage for Node.js
- **nyc** — Istanbul CLI

```typescript
interface CoverageProvider {
  name: string;
  detect(): Promise<boolean>;
  run(options: RunOptions): Promise<CoverageReport>;
  parse(reportPath: string): Promise<CoverageReport>;
}
```

#### Workflow Gates

```yaml
# In workflow template
stages:
  - name: testing
    type: verification
    gate:
      type: coverage_threshold
      thresholds:
        lines: 80
        branches: 75
      diffOnly: true  # Only check changed files
```

#### CLI Commands

```bash
# Run tests with coverage
choragen test --coverage

# Show coverage summary
choragen coverage

# Show coverage for specific files
choragen coverage packages/core/src/lint/

# Check coverage against thresholds
choragen coverage:check

# Show uncovered lines
choragen coverage:gaps

# Generate coverage report
choragen coverage:report --format=html
```

#### Agent Tool

```typescript
{
  name: "test_coverage",
  description: "Check test coverage for files or the entire project",
  parameters: {
    files: { type: "array", items: { type: "string" } },
    threshold: { type: "number", description: "Minimum coverage %" },
  },
  execute: async ({ files, threshold }) => {
    const report = await coverageEngine.getReport(files);
    const gaps = report.files.filter(f => f.lines.percentage < threshold);
    return {
      summary: report.summary,
      gaps: gaps.map(f => ({
        file: f.path,
        coverage: f.lines.percentage,
        uncoveredLines: f.uncoveredLines,
      })),
      passed: gaps.length === 0,
    };
  },
}
```

---

## Web Dashboard

### Routes

- `/coverage` — Overview dashboard with summary metrics
- `/coverage/files` — File-level coverage browser
- `/coverage/files/[path]` — Single file with line-by-line coverage
- `/coverage/tests` — Test inventory with metadata
- `/coverage/gaps` — Uncovered code requiring attention
- `/coverage/trends` — Coverage trends over time
- `/coverage/config` — Threshold and rule configuration

### Components

- **Coverage Summary Card** — Overall metrics with trend indicators
- **Coverage Heatmap** — Visual representation of coverage by directory
- **File Coverage Table** — Sortable list with coverage metrics
- **Source Viewer** — Code with coverage highlighting (green/red lines)
- **Gap List** — Prioritized list of uncovered code
- **Test Inventory** — All tests with source mappings
- **Threshold Editor** — Configure global and per-path thresholds
- **Trend Chart** — Coverage over time with annotations

### Trust Score Integration

Coverage contributes to the overall trust score:

```typescript
trustScore = (
  lintScore * 0.4 +
  coverageScore * 0.4 +
  testPassRate * 0.2
)
```

Where:
- `lintScore` = % of artifacts passing lint
- `coverageScore` = % of thresholds met
- `testPassRate` = % of tests passing

---

## User Stories

### As a Human Operator

I want to see overall test coverage at a glance  
So that I can assess the testing health of the project

### As a Human Operator

I want to configure coverage thresholds per directory  
So that I can set appropriate standards for different parts of the codebase

### As a Human Operator

I want coverage gates in workflows  
So that I can trust that completed work is adequately tested

### As an AI Agent

I want to check coverage before completing a task  
So that I can add tests for any gaps before human review

### As an AI Agent

I want to see which lines are uncovered  
So that I can write targeted tests for missing coverage

---

## Acceptance Criteria

- [ ] Coverage report parsing from Vitest/Jest/c8
- [ ] Coverage summary displayed on dashboard
- [ ] File-level coverage browser with metrics
- [ ] Source viewer with line-by-line coverage highlighting
- [ ] Global threshold configuration
- [ ] Per-directory threshold overrides
- [ ] Coverage exclusion patterns
- [ ] Test inventory with source mappings
- [ ] Orphan file detection (source without tests)
- [ ] Skipped test tracking and alerting
- [ ] Coverage trend visualization
- [ ] Diff coverage for changed files
- [ ] `choragen coverage` CLI command
- [ ] `choragen coverage:check` threshold validation
- [ ] `coverage_threshold` workflow gate type
- [ ] `test_coverage` agent tool
- [ ] Coverage contributes to trust score
- [ ] Required test pattern enforcement

---

## Linked ADRs

- ADR-012: Universal Artifact Linting (trust layer architecture)
- ADR-013: Test Coverage Dashboard (to be created)

---

## Linked Scenarios

- [Human-Driven Development](../scenarios/human-driven-development.md) — Testing enables trust in agent-generated code

---

## Linked Use Cases

- UC-010: Monitor coverage before merging
- UC-011: Configure per-module coverage thresholds
- UC-012: Identify and fill coverage gaps

---

## Implementation

[Added when implemented]

### Phase 1: Core Infrastructure
- Coverage report parsing (Vitest/Jest)
- Coverage data model and storage
- CLI `choragen coverage` command
- Basic threshold checking

### Phase 2: Web Dashboard
- Coverage overview page
- File browser with metrics
- Source viewer with highlighting
- Threshold configuration UI

### Phase 3: Advanced Features
- Test inventory and mapping
- Orphan detection
- Trend visualization
- Diff coverage

### Phase 4: Workflow Integration
- Coverage gates
- Agent tool
- Trust score integration

---

## Acceptance Tests

[Added when tests written]

- `packages/core/src/coverage/__tests__/parser.test.ts`
- `packages/core/src/coverage/__tests__/thresholds.test.ts`
- `packages/cli/src/__tests__/coverage-command.test.ts`
- `packages/web/src/__tests__/coverage-dashboard.test.ts`

---

## Design Decisions

### Coverage Provider Abstraction

Support multiple coverage tools through a provider interface. This allows projects to use their preferred test runner while getting unified coverage visibility.

Default detection order:
1. Vitest (if `vitest.config.*` exists)
2. Jest (if `jest.config.*` exists)
3. c8/nyc (fallback for Node.js projects)

### Threshold Granularity

Three levels of threshold configuration:
1. **Global** — Default for all files
2. **Directory** — Override for specific paths (glob patterns)
3. **File** — Override for specific files (exact match)

More specific overrides take precedence.

### Diff Coverage

For workflow gates, "diff coverage" checks only files changed in the current work:
- Prevents existing low-coverage files from blocking new work
- Ensures new code meets standards
- Gradual improvement path for legacy codebases

### Test-Source Mapping

Infer which tests cover which source files through:
1. **Naming convention** — `foo.ts` → `foo.test.ts`
2. **Directory structure** — `src/foo.ts` → `__tests__/foo.test.ts`
3. **Import analysis** — Parse test imports to find covered files
4. **Coverage data** — Runtime coverage shows actual execution paths

### Required Test Patterns

Beyond coverage percentages, enforce that certain source patterns have corresponding test patterns:
- API routes → integration tests
- Core utilities → unit tests
- Features → acceptance tests

This ensures test *existence*, not just coverage metrics.
