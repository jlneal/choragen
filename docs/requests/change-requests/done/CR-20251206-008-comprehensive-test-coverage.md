# Change Request: Comprehensive Test Coverage

**ID**: CR-20251206-008  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-06  
**Owner**: agent  

---

## What

Add comprehensive test coverage for all core packages. Currently only 3 test files exist (governance-checker, governance-parser, task-parser) with 32 tests total. Major components lack any test coverage.

---

## Why

1. **Quality assurance** — Untested code is unreliable code
2. **Refactoring safety** — Tests enable confident changes
3. **Documentation** — Tests serve as executable documentation
4. **Dogfooding** — Choragen's own rules require test coverage; we should follow them

---

## Scope

**In Scope**:
- `ChainManager` unit tests
- `TaskManager` unit tests  
- `LockManager` unit tests
- CLI integration tests (at least smoke tests)
- ESLint rule tests (at least for critical rules)
- `@choragen/contracts` unit tests

**Out of Scope**:
- E2E tests with real git operations
- Performance/load testing
- Visual regression testing

---

## Affected Design Documents

- docs/design/core/features/task-chain-management.md
- docs/design/core/features/governance-enforcement.md
- docs/design/core/features/file-locking.md

---

## Linked ADRs

- ADR-001-task-file-format
- ADR-002-governance-schema
- ADR-003-file-locking

---

## Commits

No commits yet.

---

## Implementation Notes

Priority order:
1. `ChainManager` — Most complex, highest risk
2. `TaskManager` — Core workflow operations
3. `LockManager` — Coordination primitive
4. `DesignContract` — After FR-20251206-008 fixes the API
5. ESLint rules — Start with `require-design-contract`, `no-magic-numbers-http`
6. CLI — Smoke tests for each command

Test patterns to follow:
- Use `@design-doc` metadata tags
- Use `HttpStatus` enum, not magic numbers
- Follow existing test file structure

---

## Completion Notes

**Completed**: 2025-12-07

**Test count**: 32 → 244 (+212 tests, 7.6x increase)

**Test files created**:
- `packages/core/src/tasks/__tests__/chain-manager.test.ts` (47 tests)
- `packages/core/src/tasks/__tests__/task-manager.test.ts` (51 tests)
- `packages/core/src/locks/__tests__/lock-manager.test.ts` (39 tests)
- `packages/contracts/src/__tests__/design-contract.test.ts` (45 tests)
- `packages/eslint-plugin/src/__tests__/rules.test.ts` (11 tests)
- `packages/cli/src/__tests__/cli.test.ts` (19 tests)

**Coverage by package**:
- @choragen/core: 169 tests (was 32)
- @choragen/contracts: 45 tests (was 0)
- @choragen/eslint-plugin: 11 tests (was 0)
- @choragen/cli: 19 tests (was 0)

**Task chain**: CHAIN-022-test-coverage (7 tasks)
