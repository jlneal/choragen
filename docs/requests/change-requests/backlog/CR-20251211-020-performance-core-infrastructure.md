# Change Request: Performance Core Infrastructure

**ID**: CR-20251211-020  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Build the foundational infrastructure for Performance Contracts: latency and memory contracts, benchmark framework, configuration, and CLI commands.

---

## Why

Performance is a critical dimension of code quality that correctness contracts don't address. Agent-generated code may be correct but inefficient. This CR establishes the core infrastructure for measuring and enforcing performance requirements.

---

## Scope

**In Scope**:
- `@choragen/contracts` performance extensions
- `@perf.latency()` decorator for execution time limits
- `@perf.memory()` decorator for memory limits
- Inline `perf.assertLatency()` for ad-hoc checks
- Benchmark framework with baseline comparison
- Performance report data model
- Configuration via `.choragen/performance.yaml`
- CLI commands: `choragen perf`, `choragen perf:bench`, `choragen perf:check`

**Out of Scope**:
- Complexity analysis — CR-20251211-021
- Web dashboard — CR-20251211-022
- Workflow integration — CR-20251211-023

---

## Acceptance Criteria

- [ ] `@perf.latency({ max, unit })` decorator measures and enforces execution time
- [ ] `@perf.memory({ max, unit })` decorator measures and enforces memory usage
- [ ] Inline `perf.startTimer()` and `perf.assertLatency()` for manual timing
- [ ] Performance violations captured with context
- [ ] Benchmark suite runner with multiple iterations
- [ ] Warmup runs before measurement
- [ ] Baseline storage and comparison
- [ ] Regression detection (>threshold% slower)
- [ ] Configuration loads from `.choragen/performance.yaml`
- [ ] Default thresholds configurable
- [ ] `choragen perf` runs performance checks
- [ ] `choragen perf:bench` runs benchmark suite
- [ ] `choragen perf:check` validates against thresholds
- [ ] Performance score calculation (0-100)

---

## Affected Design Documents

- [Performance Contracts](../../../design/core/features/performance-contracts.md)

---

## Linked ADRs

- ADR-016: Performance Contracts (to be created)

---

## Dependencies

- **CR-20251211-012**: Contracts Core Infrastructure (extends contracts package)

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create:

```
packages/contracts/src/
├── performance/
│   ├── index.ts
│   ├── decorators/
│   │   ├── latency.ts          # @perf.latency decorator
│   │   └── memory.ts           # @perf.memory decorator
│   ├── inline/
│   │   └── timer.ts            # perf.startTimer, perf.assertLatency
│   ├── benchmark/
│   │   ├── runner.ts           # Benchmark execution
│   │   ├── baseline.ts         # Baseline storage
│   │   └── comparison.ts       # Regression detection
│   ├── config.ts               # Configuration loader
│   └── types.ts                # PerformanceReport, etc.
└── __tests__/
    ├── latency.test.ts
    ├── memory.test.ts
    └── benchmark.test.ts
```

CLI commands:
```
packages/cli/src/commands/perf.ts
packages/cli/src/commands/perf-bench.ts
packages/cli/src/commands/perf-check.ts
```

Latency measurement approach:
```typescript
function latency(options: { max: number; unit: "ms" | "s" }) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      const result = await original.apply(this, args);
      const elapsed = performance.now() - start;
      if (elapsed > options.max) {
        performanceCollector.recordViolation({ ... });
      }
      return result;
    };
  };
}
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
