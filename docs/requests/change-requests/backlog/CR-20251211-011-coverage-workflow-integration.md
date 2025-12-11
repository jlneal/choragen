# Change Request: Coverage Workflow Integration

**ID**: CR-20251211-011  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Integrate test coverage with the workflow orchestration system, enabling coverage gates that block workflow advancement, diff coverage for changed files, and agent tools for self-verification.

---

## Why

Coverage without enforcement is advisory. To achieve the trust layer vision—where generated code doesn't need human review—coverage must be **enforced**:

- Workflow gates fail if coverage drops below threshold
- Diff coverage ensures new code is tested, not just existing code
- Agents can check coverage before completing work
- Required test patterns are validated before advancement

This closes the loop: governance controls access, linting verifies structure, coverage verifies behavior, workflow enforces all three.

---

## Scope

**In Scope**:
- New gate type: `coverage_threshold` — requires coverage above threshold
- New gate type: `required_tests` — requires test patterns exist
- Diff coverage: check only changed files against thresholds
- Agent tool: `test_coverage` — check coverage for self-correction
- Agent tool: `run_tests` — execute tests and get results
- Coverage results in workflow messages
- Workflow template updates to include coverage gates

**Out of Scope**:
- Test generation (future enhancement)
- Mutation testing
- Flaky test detection

---

## Acceptance Criteria

- [ ] `coverage_threshold` gate type blocks if coverage below threshold
- [ ] `coverage_threshold` supports `diffOnly: true` for changed files only
- [ ] `required_tests` gate type blocks if required test patterns missing
- [ ] Diff coverage calculates coverage for files changed in current work
- [ ] Agents can call `test_coverage` tool to check coverage
- [ ] Agents can call `run_tests` tool to execute tests
- [ ] Test results appear as system messages in workflow chat
- [ ] Standard workflow template includes coverage gate
- [ ] Gate failure message includes coverage summary and gaps
- [ ] Coverage gates can be configured as warn-only for transition

---

## Affected Design Documents

- [Test Coverage Dashboard](../../../design/core/features/test-coverage-dashboard.md)
- [Workflow Orchestration](../../../design/core/features/workflow-orchestration.md)

---

## Linked ADRs

- ADR-011: Workflow Orchestration
- ADR-013: Test Coverage Dashboard

---

## Dependencies

- **CR-20251211-008**: Coverage Core Infrastructure
- **CR-20251211-009**: Test Inventory and Mapping
- **CR-20251211-010**: Coverage Web Dashboard

---

## Commits

No commits yet.

---

## Implementation Notes

New gate types in workflow templates:

```yaml
stages:
  - name: implementation
    type: implementation
    gate:
      type: chain_complete
  
  - name: testing
    type: verification
    gate:
      type: coverage_threshold
      thresholds:
        lines: 80
        branches: 75
      diffOnly: true
  
  - name: test-patterns
    type: verification
    gate:
      type: required_tests
      patterns:
        - source: "packages/*/src/**/*.ts"
          test: "packages/*/**/__tests__/*.test.ts"
```

Gate implementation:

```typescript
case "coverage_threshold": {
  const report = gate.diffOnly
    ? await coverageEngine.getDiffCoverage(changedFiles)
    : await coverageEngine.getReport();
  
  const failures = [];
  if (report.summary.lines.percentage < gate.thresholds.lines) {
    failures.push(`Lines: ${report.summary.lines.percentage}% < ${gate.thresholds.lines}%`);
  }
  // ... check other metrics
  
  if (failures.length > 0) {
    throw new Error(`Coverage gate failed:\n${failures.join("\n")}`);
  }
  return;
}

case "required_tests": {
  const missing = await testInventory.checkRequiredPatterns(gate.patterns);
  if (missing.length > 0) {
    throw new Error(`Missing required tests:\n${missing.map(m => `  ${m.source} → ${m.test}`).join("\n")}`);
  }
  return;
}
```

Agent tools:

```typescript
{
  name: "test_coverage",
  description: "Check test coverage for files or the project",
  parameters: {
    files: { type: "array", items: { type: "string" } },
    threshold: { type: "number" },
  },
  execute: async ({ files, threshold = 80 }) => {
    const report = await coverageEngine.getReport(files);
    return {
      summary: report.summary,
      passed: report.summary.lines.percentage >= threshold,
      gaps: report.getUncoveredFiles(),
    };
  },
}

{
  name: "run_tests",
  description: "Run tests and return results",
  parameters: {
    pattern: { type: "string", description: "Test file pattern" },
    coverage: { type: "boolean", description: "Collect coverage" },
  },
  execute: async ({ pattern, coverage = true }) => {
    const result = await testRunner.run({ pattern, coverage });
    return {
      passed: result.passed,
      failed: result.failed,
      skipped: result.skipped,
      coverage: result.coverage?.summary,
    };
  },
}
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
