# Change Request: Contracts Core Infrastructure

**ID**: CR-20251211-012  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Build the foundational infrastructure for Runtime Contract Enforcement: contract decorators, inline contract functions, violation capture, configuration, and CLI commands.

---

## Why

Runtime contracts are the third pillar of the trust layer. While linting verifies structure and tests verify known behavior, contracts verify that invariants hold during actual execution. This is especially valuable for agent-generated code:

- Agents may produce code that passes tests but violates implicit assumptions
- Contracts make assumptions explicit and machine-checkable
- Contract violations provide clear feedback for agent self-correction

This CR establishes the core infrastructure that all subsequent contract features build upon.

---

## Scope

**In Scope**:
- `@choragen/contracts` package extensions
- `@requires`, `@ensures`, `@invariant` decorators
- Inline `contract.requires()`, `contract.ensures()` functions
- Violation capture with context and stack traces
- Configuration loading from `.choragen/contracts.yaml`
- Enforcement modes: enforce, log, skip
- Per-contract and per-environment mode overrides
- CLI commands: `choragen contracts`, `choragen contracts:check`, `choragen contracts:violations`

**Out of Scope**:
- Schema contracts (Zod integration) — CR-20251211-013
- Web dashboard — CR-20251211-014
- Workflow gate integration — CR-20251211-015

---

## Acceptance Criteria

- [ ] `@requires(condition, message)` decorator validates preconditions
- [ ] `@ensures(condition, message)` decorator validates postconditions
- [ ] `@invariant(condition)` decorator validates class invariants
- [ ] `contract.requires()` inline function for standalone functions
- [ ] `contract.ensures()` inline function for standalone functions
- [ ] Violations captured with: contract ID, message, context, stack trace
- [ ] Configuration loads from `.choragen/contracts.yaml`
- [ ] Global mode setting (enforce/log/skip)
- [ ] Per-contract mode overrides via glob patterns
- [ ] Environment-specific mode defaults (NODE_ENV)
- [ ] `choragen contracts` lists all contracts in project
- [ ] `choragen contracts:check` runs tests with contract collection
- [ ] `choragen contracts:violations` shows recent violations
- [ ] Violations stored in `.choragen/contract-violations.json`

---

## Affected Design Documents

- [Runtime Contract Enforcement](../../../design/core/features/runtime-contract-enforcement.md)

---

## Linked ADRs

- ADR-014: Runtime Contract Enforcement (to be created)

---

## Dependencies

- None (extends existing `@choragen/contracts` package)

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create/modify:

```
packages/contracts/src/
├── index.ts                    # Barrel exports (extend existing)
├── decorators/
│   ├── index.ts
│   ├── requires.ts             # @requires decorator
│   ├── ensures.ts              # @ensures decorator
│   └── invariant.ts            # @invariant decorator
├── inline/
│   ├── index.ts
│   └── contract.ts             # contract.requires(), contract.ensures()
├── violation/
│   ├── index.ts
│   ├── types.ts                # ContractViolation, Contract types
│   ├── collector.ts            # Violation collection
│   └── storage.ts              # Violation persistence
├── config/
│   ├── index.ts
│   └── loader.ts               # Configuration loading
└── __tests__/
    ├── decorators.test.ts
    ├── inline.test.ts
    └── config.test.ts
```

CLI commands:
```
packages/cli/src/commands/contracts.ts
packages/cli/src/commands/contracts-check.ts
packages/cli/src/commands/contracts-violations.ts
```

Decorator implementation approach:
- Use TypeScript experimental decorators (stage 3)
- Wrap method with pre/post checks
- Capture `this` for invariant access
- Support `old()` helper for postconditions

Configuration example:
```yaml
mode:
  default: enforce
  production: log

contracts:
  "BankAccount.*": enforce
  "legacy/*": skip
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
