# Feature: Performance Contracts

**Domain**: core  
**Created**: 2025-12-11  
**Status**: draft  

---

## Overview

Performance Contracts extend the trust layer to verify that code meets performance requirements: response time thresholds, memory limits, complexity bounds, and resource consumption. While correctness contracts verify *what* code does, performance contracts verify *how efficiently* it does it.

```
Trust = Lint × Tests × Contracts × Security × Performance
```

For agent-generated code, performance is critical:
- Agents may produce correct but inefficient algorithms
- Agents may not consider resource constraints
- Performance regressions can be subtle and hard to detect
- Production performance issues are costly to fix

---

## Capabilities

### Response Time Contracts

- Maximum execution time for functions
- API endpoint latency thresholds
- Percentile-based SLOs (p50, p95, p99)
- Timeout enforcement

### Memory Contracts

- Maximum memory allocation per operation
- Memory leak detection
- Heap size limits
- Object allocation tracking

### Complexity Contracts

- Algorithmic complexity bounds (O(n), O(n²), etc.)
- Input size scaling verification
- Loop iteration limits
- Recursion depth limits

### Resource Contracts

- CPU usage limits
- I/O operation counts
- Network request limits
- Database query counts (N+1 detection)

### Benchmark Tracking

- Performance regression detection
- Historical benchmark comparison
- Baseline establishment
- Trend visualization

---

## Architecture

### Performance Data Model

```typescript
interface PerformanceReport {
  timestamp: Date;
  summary: PerformanceSummary;
  contracts: PerformanceContract[];
  violations: PerformanceViolation[];
  benchmarks: BenchmarkResult[];
}

interface PerformanceSummary {
  contractsPassed: number;
  contractsFailed: number;
  regressions: number;
  score: number; // 0-100
}

interface PerformanceContract {
  id: string;
  type: "latency" | "memory" | "complexity" | "resource";
  target: string;           // Function or endpoint
  threshold: number;
  unit: string;             // "ms", "MB", "O(n)", "count"
  percentile?: number;      // For latency (p50, p95, p99)
}

interface PerformanceViolation {
  contractId: string;
  measured: number;
  threshold: number;
  timestamp: Date;
  context: Record<string, unknown>;
}

interface BenchmarkResult {
  name: string;
  current: number;
  baseline: number;
  change: number;           // Percentage change
  regression: boolean;
}
```

### Contract Definition Syntax

```typescript
import { perf } from "@choragen/contracts";

// Latency contract
@perf.latency({ max: 100, unit: "ms" })
async function fetchUser(id: string): Promise<User> {
  return db.users.findById(id);
}

// Memory contract
@perf.memory({ max: 10, unit: "MB" })
function processLargeDataset(data: Data[]): Result {
  // ...
}

// Complexity contract
@perf.complexity({ max: "O(n)" })
function findItem<T>(items: T[], predicate: (t: T) => boolean): T | undefined {
  return items.find(predicate); // O(n) - passes
}

// Resource contract
@perf.queries({ max: 1 })
async function getUserWithPosts(id: string): Promise<UserWithPosts> {
  // Must use JOIN, not N+1 queries
  return db.users.findById(id, { include: ["posts"] });
}

// Inline contracts
function search(items: Item[], query: string): Item[] {
  perf.startTimer("search");
  const result = items.filter(i => i.name.includes(query));
  perf.assertLatency("search", { max: 50, unit: "ms" });
  return result;
}
```

### Configuration Schema

```yaml
# .choragen/performance.yaml
contracts:
  latency:
    default:
      max: 200
      unit: ms
    overrides:
      "api/*":
        max: 100
        percentile: 95
      "background/*":
        max: 5000

  memory:
    default:
      max: 50
      unit: MB
    
  complexity:
    enforce: true
    maxAllowed: "O(n log n)"

benchmarks:
  enabled: true
  regressionThreshold: 10  # Alert if >10% slower
  baselineBranch: main

thresholds:
  minScore: 80
  maxViolations: 0
```

### Integration Points

#### Workflow Gates

```yaml
stages:
  - name: performance
    type: verification
    gate:
      type: performance_check
      minScore: 80
      regressionThreshold: 10
      contracts:
        latency: true
        memory: true
```

#### CLI Commands

```bash
# Run performance checks
choragen perf

# Run benchmarks
choragen perf:bench

# Compare to baseline
choragen perf:compare

# Check contracts
choragen perf:check

# Profile specific function
choragen perf:profile <function>
```

#### Agent Tool

```typescript
{
  name: "performance_check",
  description: "Check performance contracts and benchmarks",
  parameters: {
    files: { type: "array", items: { type: "string" } },
    runBenchmarks: { type: "boolean" },
  },
  execute: async ({ files, runBenchmarks = false }) => {
    const report = await performanceEngine.check(files, { runBenchmarks });
    return {
      passed: report.summary.score >= 80,
      score: report.summary.score,
      violations: report.violations,
      regressions: report.benchmarks.filter(b => b.regression),
    };
  },
}
```

---

## Web Dashboard

### Routes

- `/performance` — Overview with performance score
- `/performance/contracts` — Contract status and violations
- `/performance/benchmarks` — Benchmark results and trends
- `/performance/regressions` — Detected regressions
- `/performance/config` — Configuration UI

### Components

- **Performance Score Card** — Overall performance health
- **Contract Status Table** — Pass/fail status per contract
- **Benchmark Chart** — Performance over time
- **Regression Alert** — Highlighted regressions
- **Flame Graph** — Profile visualization (future)

### Trust Score Integration

```typescript
trustScore = (
  lintScore * 0.20 +
  coverageScore * 0.20 +
  testPassRate * 0.15 +
  contractScore * 0.15 +
  securityScore * 0.15 +
  performanceScore * 0.15
)
```

---

## User Stories

### As a Human Operator

I want to set latency thresholds for API endpoints  
So that I can ensure consistent response times

### As a Human Operator

I want to detect performance regressions automatically  
So that I can catch slowdowns before production

### As an AI Agent

I want to check performance before completing work  
So that I can optimize inefficient code

### As an AI Agent

I want complexity feedback on my algorithms  
So that I avoid O(n²) when O(n) is possible

---

## Acceptance Criteria

- [ ] `@perf.latency()` decorator enforces execution time limits
- [ ] `@perf.memory()` decorator enforces memory limits
- [ ] `@perf.complexity()` decorator validates algorithmic complexity
- [ ] `@perf.queries()` decorator detects N+1 query patterns
- [ ] Inline `perf.assertLatency()` for ad-hoc checks
- [ ] Configuration via `.choragen/performance.yaml`
- [ ] Benchmark suite with regression detection
- [ ] Historical benchmark comparison
- [ ] `choragen perf` CLI command
- [ ] `choragen perf:bench` runs benchmarks
- [ ] `performance_check` workflow gate
- [ ] `performance_check` agent tool
- [ ] Web dashboard with performance score
- [ ] Performance contributes to trust score

---

## Linked ADRs

- ADR-016: Performance Contracts (to be created)

---

## Implementation

### Phase 1: Core Infrastructure
- Latency and memory contracts
- Basic benchmark framework
- CLI commands
- Configuration

### Phase 2: Advanced Contracts
- Complexity analysis
- Resource tracking (queries, I/O)
- N+1 detection

### Phase 3: Web Dashboard
- Performance overview
- Benchmark visualization
- Regression alerts

### Phase 4: Workflow Integration
- Performance gates
- Agent tools
- Trust score integration

---

## Design Decisions

### Complexity Analysis Approach

Static analysis for obvious cases (nested loops), runtime sampling for complex cases. Accept that complexity analysis is approximate — focus on catching O(n²) when O(n) is expected.

### Benchmark Stability

Use statistical methods to reduce noise:
- Multiple iterations with warmup
- Outlier removal
- Confidence intervals
- Require significant change (>10%) to flag regression

### Memory Measurement

Use V8 heap snapshots for accurate memory measurement. Track allocations during function execution, not just peak heap size.

### N+1 Detection

Instrument database queries during test runs. Flag when query count scales with result set size.
