# Change Request: Performance Workflow Integration

**ID**: CR-20251211-023  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Integrate performance contracts with the workflow orchestration system, enabling performance gates and agent tools for performance verification.

---

## Why

Performance without enforcement is advisory. To maintain performance standards:

- Workflow gates fail if performance contracts are violated
- Workflow gates fail if benchmarks regress significantly
- Agents can check performance before completing work
- Performance regressions are caught before merge

---

## Scope

**In Scope**:
- New gate type: `performance_check` — requires performance score above threshold
- New gate type: `no_regressions` — requires no benchmark regressions
- Agent tool: `performance_check` — check performance for self-correction
- Performance results in workflow messages
- Workflow template updates to include performance gates

**Out of Scope**:
- Automated performance optimization
- Performance alerting (Slack, email)
- Production performance monitoring

---

## Acceptance Criteria

- [ ] `performance_check` gate type blocks if score below threshold
- [ ] `performance_check` supports contract type filtering (latency, memory, etc.)
- [ ] `no_regressions` gate type blocks if benchmarks regress >threshold%
- [ ] Agents can call `performance_check` tool
- [ ] Performance results appear in workflow chat
- [ ] Standard workflow template includes performance gate
- [ ] Gate failure message includes performance summary
- [ ] Performance gates can be configured as warn-only

---

## Affected Design Documents

- [Performance Contracts](../../../design/core/features/performance-contracts.md)
- [Workflow Orchestration](../../../design/core/features/workflow-orchestration.md)

---

## Linked ADRs

- ADR-011: Workflow Orchestration
- ADR-016: Performance Contracts

---

## Dependencies

- **CR-20251211-020**: Performance Core Infrastructure
- **CR-20251211-021**: Performance Advanced Contracts
- **CR-20251211-022**: Performance Web Dashboard

---

## Commits

No commits yet.

---

## Implementation Notes

New gate types in workflow templates:

```yaml
stages:
  - name: performance
    type: verification
    gate:
      type: performance_check
      minScore: 80
      contracts:
        latency: true
        memory: true
        complexity: true
  
  - name: benchmarks
    type: verification
    gate:
      type: no_regressions
      threshold: 10  # Max 10% regression allowed
```

Gate implementation:

```typescript
case "performance_check": {
  const report = await performanceEngine.check();
  
  if (report.summary.score < gate.minScore) {
    throw new Error(`Performance score ${report.summary.score} below threshold ${gate.minScore}`);
  }
  
  if (report.violations.length > 0) {
    throw new Error(`${report.violations.length} performance contract violations`);
  }
  
  return;
}

case "no_regressions": {
  const benchmarks = await performanceEngine.runBenchmarks();
  const regressions = benchmarks.filter(b => b.change > gate.threshold);
  
  if (regressions.length > 0) {
    throw new Error(
      `Performance regressions detected:\n` +
      regressions.map(r => `  ${r.name}: ${r.change}% slower`).join("\n")
    );
  }
  
  return;
}
```

Agent tool:

```typescript
{
  name: "performance_check",
  description: "Check performance contracts and benchmarks",
  parameters: {
    files: { type: "array", items: { type: "string" } },
    runBenchmarks: { type: "boolean", default: false },
  },
  execute: async ({ files, runBenchmarks }) => {
    const report = await performanceEngine.check(files, { runBenchmarks });
    return {
      passed: report.summary.score >= 80 && report.violations.length === 0,
      score: report.summary.score,
      violations: report.violations,
      regressions: runBenchmarks 
        ? report.benchmarks.filter(b => b.regression)
        : [],
    };
  },
}
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
