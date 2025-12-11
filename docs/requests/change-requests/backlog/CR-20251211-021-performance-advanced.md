# Change Request: Performance Advanced Contracts

**ID**: CR-20251211-021  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Add advanced performance contracts: algorithmic complexity analysis, resource tracking (database queries, I/O), and N+1 query detection.

---

## Why

Basic latency and memory contracts catch obvious issues, but advanced contracts catch subtler problems:

- O(n²) algorithms that seem fast on small inputs but fail at scale
- N+1 query patterns that cause database performance issues
- Excessive I/O or network calls that add latency

These are common issues in agent-generated code that may not be caught by basic tests.

---

## Scope

**In Scope**:
- `@perf.complexity()` decorator for algorithmic complexity bounds
- `@perf.queries()` decorator for database query limits
- `@perf.io()` decorator for I/O operation limits
- N+1 query detection via query instrumentation
- Complexity estimation via runtime sampling
- `choragen perf:profile` for detailed profiling

**Out of Scope**:
- Web dashboard (CR-20251211-022)
- Workflow integration (CR-20251211-023)
- Static complexity analysis (future enhancement)

---

## Acceptance Criteria

- [ ] `@perf.complexity({ max: "O(n)" })` validates algorithmic complexity
- [ ] Complexity estimated via runtime sampling with varying input sizes
- [ ] `@perf.queries({ max: N })` limits database query count
- [ ] Query instrumentation for common ORMs (Prisma, Drizzle)
- [ ] N+1 detection: flag when query count scales with result size
- [ ] `@perf.io({ max: N })` limits I/O operations
- [ ] `choragen perf:profile <function>` shows detailed breakdown
- [ ] Complexity violations include estimated complexity
- [ ] Query violations include query log

---

## Affected Design Documents

- [Performance Contracts](../../../design/core/features/performance-contracts.md)

---

## Linked ADRs

- ADR-016: Performance Contracts

---

## Dependencies

- **CR-20251211-020**: Performance Core Infrastructure

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create:

```
packages/contracts/src/performance/
├── decorators/
│   ├── complexity.ts           # @perf.complexity decorator
│   ├── queries.ts              # @perf.queries decorator
│   └── io.ts                   # @perf.io decorator
├── analysis/
│   ├── complexity-estimator.ts # Runtime complexity estimation
│   ├── query-tracker.ts        # Database query instrumentation
│   └── n-plus-one.ts           # N+1 detection
└── __tests__/
    ├── complexity.test.ts
    ├── queries.test.ts
    └── n-plus-one.test.ts
```

Complexity estimation approach:
```typescript
// Run function with increasing input sizes
// Measure time for each
// Fit curve to determine complexity class
const samples = [10, 100, 1000, 10000];
const times = samples.map(n => measureTime(() => fn(generateInput(n))));
const complexity = fitComplexityCurve(samples, times);
// Returns "O(1)", "O(n)", "O(n log n)", "O(n²)", etc.
```

Query tracking approach:
```typescript
// Wrap database client
const trackedDb = trackQueries(db);
// Run function
await fn(trackedDb);
// Check query count
const queryCount = trackedDb.getQueryCount();
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
