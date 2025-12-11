# Feature: Runtime Contract Enforcement

**Domain**: core  
**Created**: 2025-12-11  
**Status**: draft  

---

## Overview

Runtime Contract Enforcement provides the third pillar of the trust layer: verifying that code satisfies invariants, preconditions, and postconditions during actual execution. While linting verifies structure and tests verify behavior against known inputs, contracts verify that assumptions hold in real usage.

```
Trust = Lint (structure) × Tests (known behavior) × Contracts (runtime invariants)
```

For agent-generated code, contracts are especially valuable:
- Agents may produce code that passes tests but violates implicit assumptions
- Contracts make assumptions explicit and machine-checkable
- Contract violations provide clear, actionable feedback for agent self-correction
- Runtime verification catches edge cases that tests miss

---

## Capabilities

### Contract Definition

- **Preconditions**: Assertions that must hold before a function executes
- **Postconditions**: Assertions that must hold after a function completes
- **Invariants**: Assertions that must hold throughout an object's lifetime
- **Type contracts**: Runtime type validation at boundaries (API, external data)
- **Schema contracts**: Structured data validation (JSON Schema, Zod)

### Contract Types

| Type | Purpose | Example |
|------|---------|---------|
| **Function contracts** | Pre/post conditions on functions | `@requires(x > 0)`, `@ensures(result >= 0)` |
| **API contracts** | Request/response validation | Schema validation on endpoints |
| **Data contracts** | Type safety at boundaries | Zod parsing of external input |
| **Integration contracts** | External service expectations | Response shape from third-party APIs |
| **Invariant contracts** | Class/module invariants | `balance >= 0` always true |

### Enforcement Modes

- **Development**: Contracts checked, violations throw errors
- **Testing**: Contracts checked, violations logged and collected
- **Production**: Configurable per-contract (check, log, or skip)
- **Monitoring**: Violations reported to dashboard without blocking

### Contract Dashboard

- Real-time violation monitoring
- Violation history and trends
- Contract coverage (which code has contracts)
- Contract configuration (enable/disable, mode per contract)
- Violation details with stack traces and context

### Agent Integration

- Agents can query contract status before completing work
- Contract violations surfaced as actionable items
- `check_contracts` tool for agent self-verification
- Contract generation suggestions based on function signatures

---

## Architecture

### Contract Definition Syntax

```typescript
import { contract, requires, ensures, invariant } from "@choragen/contracts";

// Function contract with decorators
class BankAccount {
  @invariant(() => this.balance >= 0)
  private balance: number = 0;

  @requires((amount) => amount > 0, "Amount must be positive")
  @ensures((result, { amount }) => this.balance === old(this.balance) + amount)
  deposit(amount: number): void {
    this.balance += amount;
  }

  @requires((amount) => amount > 0 && amount <= this.balance)
  @ensures((result, { amount }) => this.balance === old(this.balance) - amount)
  withdraw(amount: number): void {
    this.balance -= amount;
  }
}

// Inline contract
function divide(a: number, b: number): number {
  contract.requires(b !== 0, "Divisor cannot be zero");
  const result = a / b;
  contract.ensures(result * b === a, "Division must be reversible");
  return result;
}
```

### Schema Contracts (API Boundaries)

```typescript
import { z } from "zod";
import { apiContract } from "@choragen/contracts";

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
});

// API route with contract
export const GET = apiContract({
  response: UserSchema,
  handler: async (request) => {
    const user = await db.getUser(request.params.id);
    return user; // Validated against UserSchema
  },
});
```

### Data Model

```typescript
interface Contract {
  id: string;
  type: "precondition" | "postcondition" | "invariant" | "schema";
  location: ContractLocation;
  expression: string;
  message?: string;
  mode: "enforce" | "log" | "skip";
}

interface ContractLocation {
  file: string;
  line: number;
  function?: string;
  class?: string;
}

interface ContractViolation {
  contractId: string;
  timestamp: Date;
  location: ContractLocation;
  message: string;
  context: Record<string, unknown>;
  stackTrace: string;
  mode: "error" | "warning";
}

interface ContractReport {
  contracts: Contract[];
  violations: ContractViolation[];
  coverage: ContractCoverage;
}

interface ContractCoverage {
  functionsWithContracts: number;
  totalFunctions: number;
  percentage: number;
}
```

### Configuration Schema

```yaml
# .choragen/contracts.yaml
mode:
  default: enforce  # enforce | log | skip
  production: log   # Override for production
  
contracts:
  # Per-contract overrides
  "BankAccount.withdraw.precondition": 
    mode: enforce
  "api/*":
    mode: enforce
  "legacy/*":
    mode: log  # Gradually enable for legacy code

thresholds:
  # Alert if violations exceed threshold
  maxViolationsPerHour: 10
  maxViolationsPerEndpoint: 5

reporting:
  # Where to send violations
  dashboard: true
  slack: false
  email: false
```

### Integration Points

#### Workflow Gates

```yaml
# In workflow template
stages:
  - name: contract-check
    type: verification
    gate:
      type: contract_pass
      mode: enforce  # All contracts must pass
      allowedViolations: 0
```

#### CLI Commands

```bash
# List all contracts in project
choragen contracts

# Check contracts (run with contract assertions)
choragen contracts:check

# Show contract coverage
choragen contracts:coverage

# Show recent violations
choragen contracts:violations

# Generate contract stubs for uncovered functions
choragen contracts:generate
```

#### Agent Tool

```typescript
{
  name: "check_contracts",
  description: "Verify runtime contracts pass for specified code",
  parameters: {
    files: { type: "array", items: { type: "string" } },
    runTests: { type: "boolean", description: "Run tests to trigger contracts" },
  },
  execute: async ({ files, runTests = true }) => {
    if (runTests) {
      await testRunner.run({ files, collectContracts: true });
    }
    const violations = await contractEngine.getViolations(files);
    return {
      passed: violations.length === 0,
      violations: violations.map(v => ({
        contract: v.contractId,
        message: v.message,
        location: `${v.location.file}:${v.location.line}`,
      })),
    };
  },
}
```

---

## Web Dashboard

### Routes

- `/contracts` — Overview dashboard with violation summary
- `/contracts/list` — All contracts with status and configuration
- `/contracts/violations` — Violation browser with filtering
- `/contracts/coverage` — Contract coverage by file/function
- `/contracts/config` — Contract configuration UI
- `/contracts/live` — Real-time violation monitor (WebSocket)

### Components

- **Violation Summary Card** — Recent violations with trend
- **Contract List** — All contracts with enable/disable toggles
- **Violation Timeline** — Violations over time
- **Violation Detail** — Full context, stack trace, reproduction steps
- **Coverage Heatmap** — Which code has contracts
- **Live Monitor** — Real-time violation stream

### Trust Score Integration

Contracts contribute to the overall trust score:

```typescript
trustScore = (
  lintScore * 0.3 +
  coverageScore * 0.3 +
  testPassRate * 0.2 +
  contractScore * 0.2
)
```

Where `contractScore` = (1 - violationRate) × contractCoverage

---

## User Stories

### As a Human Operator

I want to see contract violations in real-time  
So that I can catch runtime issues before they affect users

### As a Human Operator

I want to configure contract enforcement per-environment  
So that I can enforce strictly in dev but log-only in production

### As a Human Operator

I want contract gates in workflows  
So that I can trust agent-generated code satisfies invariants

### As an AI Agent

I want to check contracts before completing a task  
So that I can fix violations before human review

### As an AI Agent

I want clear contract violation messages  
So that I can understand and fix the issue without human help

---

## Acceptance Criteria

- [ ] `@requires`, `@ensures`, `@invariant` decorators work
- [ ] Inline `contract.requires()`, `contract.ensures()` work
- [ ] Schema contracts validate API responses
- [ ] Violations captured with full context and stack trace
- [ ] Configuration loads from `.choragen/contracts.yaml`
- [ ] Per-contract mode overrides (enforce/log/skip)
- [ ] Environment-specific mode defaults
- [ ] `choragen contracts` CLI command lists contracts
- [ ] `choragen contracts:check` runs contract verification
- [ ] `choragen contracts:violations` shows recent violations
- [ ] Web dashboard shows violation summary
- [ ] Real-time violation monitoring via WebSocket
- [ ] Contract coverage metrics
- [ ] `contract_pass` workflow gate type
- [ ] `check_contracts` agent tool
- [ ] Contracts contribute to trust score

---

## Linked ADRs

- ADR-012: Universal Artifact Linting (trust layer architecture)
- ADR-014: Runtime Contract Enforcement (to be created)

---

## Linked Scenarios

- [Human-Driven Development](../scenarios/human-driven-development.md) — Contracts enable trust in agent-generated code

---

## Linked Use Cases

- UC-020: Monitor contract violations in production
- UC-021: Configure contract enforcement per environment
- UC-022: Add contracts to agent-generated code

---

## Implementation

[Added when implemented]

### Phase 1: Core Infrastructure
- Contract decorator implementation
- Inline contract functions
- Violation capture and storage
- CLI `choragen contracts` command

### Phase 2: Schema Contracts
- Zod integration for API contracts
- `apiContract` wrapper for routes
- Request/response validation

### Phase 3: Web Dashboard
- Violation browser
- Contract list with configuration
- Real-time monitoring
- Coverage visualization

### Phase 4: Workflow Integration
- Contract gates
- Agent tools
- Trust score integration

---

## Acceptance Tests

[Added when tests written]

- `packages/contracts/src/__tests__/decorators.test.ts`
- `packages/contracts/src/__tests__/inline.test.ts`
- `packages/contracts/src/__tests__/schema.test.ts`
- `packages/cli/src/__tests__/contracts-command.test.ts`
- `packages/web/src/__tests__/contracts-dashboard.test.ts`

---

## Design Decisions

### Decorator vs Inline Syntax

Support both:
- **Decorators** for class methods (cleaner, declarative)
- **Inline functions** for standalone functions (no decorator support)

Decorators require TypeScript experimental decorators or the new TC39 decorators.

### Enforcement Modes

Three modes provide flexibility:
- **enforce**: Throw on violation (development default)
- **log**: Log violation but continue (production default)
- **skip**: Disable contract entirely (performance-critical paths)

Mode can be set globally, per-environment, or per-contract.

### Schema Contracts vs Type Contracts

- **Schema contracts** (Zod): For external data, API boundaries
- **Type contracts** (decorators): For internal invariants

Both serve different purposes and should coexist.

### Performance Considerations

Contracts add runtime overhead. Mitigations:
- Skip mode for hot paths
- Compile-time removal in production builds (optional)
- Sampling for high-frequency contracts
- Async violation reporting (don't block on logging)

### Integration with Existing Code

For existing codebases:
1. Start with API boundary contracts (highest value)
2. Add contracts to new code via workflow gates
3. Gradually add to existing code based on coverage reports
4. Use log mode initially, upgrade to enforce as confidence grows

### Relationship to DesignContract

The existing `DesignContract` in `@choragen/contracts` links API routes to design docs. This feature extends it:
- `DesignContract` → traceability (which design doc governs this route)
- `apiContract` → runtime validation (does the response match the schema)

They can be combined:
```typescript
export const GET = DesignContract({
  designDoc: "docs/design/core/features/users.md",
  handler: apiContract({
    response: UserSchema,
    handler: async (req) => { ... }
  }),
});
```
