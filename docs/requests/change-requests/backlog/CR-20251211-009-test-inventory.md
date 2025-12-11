# Change Request: Test Inventory and Mapping

**ID**: CR-20251211-009  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Build a test inventory system that catalogs all test files, maps them to source files, detects orphan files (source without tests), and tracks test metadata including design doc references.

---

## Why

Coverage percentages alone don't tell the full story. We also need to know:

- Which source files have corresponding tests?
- Which tests cover which source files?
- Are there orphan files with no test coverage at all?
- Do tests reference the design docs they verify?
- Are there skipped or pending tests that need attention?

This inventory enables "required test pattern" enforcement — ensuring that certain source patterns (e.g., API routes) have corresponding test patterns (e.g., integration tests).

---

## Scope

**In Scope**:
- Test file discovery and classification (unit, integration, e2e)
- Test-to-source mapping via naming convention, directory structure, imports
- Orphan file detection (source files with no associated tests)
- Design doc reference extraction from test files
- Skipped/pending test tracking
- Required test pattern configuration and validation
- CLI commands: `choragen test:inventory`, `choragen test:orphans`

**Out of Scope**:
- Web dashboard (CR-20251211-010)
- Workflow integration (CR-20251211-011)
- Test execution (use existing test runners)

---

## Acceptance Criteria

- [ ] Discover all test files matching configured patterns
- [ ] Classify tests by type (unit, integration, e2e) based on path/naming
- [ ] Map tests to source files via naming convention (`foo.ts` → `foo.test.ts`)
- [ ] Map tests to source files via directory structure (`src/` → `__tests__/`)
- [ ] Map tests to source files via import analysis
- [ ] Detect orphan source files (no associated test)
- [ ] Extract design doc references from test file comments
- [ ] Track skipped tests (`.skip()`, `.todo()`)
- [ ] Configure required test patterns in `.choragen/coverage.yaml`
- [ ] Validate required test patterns exist
- [ ] `choragen test:inventory` lists all tests with metadata
- [ ] `choragen test:orphans` lists source files without tests

---

## Affected Design Documents

- [Test Coverage Dashboard](../../../design/core/features/test-coverage-dashboard.md)

---

## Linked ADRs

- ADR-013: Test Coverage Dashboard

---

## Dependencies

- **CR-20251211-008**: Coverage Core Infrastructure (uses same config file)

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create:

```
packages/core/src/coverage/
├── inventory.ts                # Test inventory builder
├── mapping.ts                  # Test-to-source mapping
├── orphans.ts                  # Orphan detection
├── required-tests.ts           # Required pattern validation
└── __tests__/
    ├── inventory.test.ts
    ├── mapping.test.ts
    └── orphans.test.ts
```

Test classification rules:
- `**/__tests__/**/*.test.ts` → unit
- `**/*.integration.test.ts` → integration
- `**/e2e/**/*.test.ts` → e2e
- Configurable via patterns

Design doc reference format:
```typescript
/**
 * @design-doc docs/design/core/features/task-management.md
 * @test-type unit
 */
describe("TaskManager", () => { ... });
```

Required test pattern config:
```yaml
requiredTests:
  - source: "packages/web/src/app/api/**/*.ts"
    test: "packages/web/src/__tests__/api/**/*.test.ts"
    type: integration
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
