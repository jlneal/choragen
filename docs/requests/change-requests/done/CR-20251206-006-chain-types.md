# Change Request: Add Chain Types (Design vs Implementation)

**ID**: CR-20251206-006  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-06  
**Owner**: Justin  

---

## What

Introduce typed chains: every request must have at least two chains - a **design chain** and an **implementation chain**. This enforces the separation between design work (radiating intent through docs) and implementation work (radiating intent through source).

---

## Why

Currently, chains conflate design and implementation tasks. This leads to:
- Design docs being skipped or treated as afterthoughts
- Implementation starting before design is complete
- Broken traceability (code without design backing)

By requiring separate chain types, we enforce the pipeline:
**Request → Design → Implementation**

---

## Proposed Model

### Chain Types

| Type | Purpose | Outputs |
|------|---------|---------|
| `design` | Radiate intent through design docs | Scenarios, use cases, features, enhancements, ADRs |
| `implementation` | Radiate intent through source | Code, tests, configs |

### Request Lifecycle

```
Request (CR/FR)
  ├── Design Chain (must complete first)
  │   ├── Task: Update/create scenarios
  │   ├── Task: Update/create use cases
  │   ├── Task: Update/create features/enhancements
  │   └── Task: Create ADRs
  │
  └── Implementation Chain (depends on design chain)
      ├── Task: Implement feature
      ├── Task: Write tests
      └── Task: Update configs
```

### Enforcement

- A request cannot be closed until both chains are complete
- Implementation chain cannot start until design chain is done (or explicitly waived for hotfixes)
- Validation scripts check chain type coverage

---

## Scope

**In Scope**:
- Add `type` field to chain metadata (`design` | `implementation`)
- Update CLI commands to specify chain type
- Update chain creation to require type
- Add validation that requests have both chain types
- Allow `--skip-design` flag for hotfixes (with justification)

**Out of Scope**:
- Automated design doc generation
- Chain dependency graphs beyond design→impl

---

## CLI Changes

```bash
# Create typed chains
choragen chain:new CR-20251206-001 my-feature "Feature title" --type=design
choragen chain:new CR-20251206-001 my-feature "Feature title" --type=implementation

# Or shorthand
choragen chain:new:design CR-20251206-001 my-feature "Feature title"
choragen chain:new:impl CR-20251206-001 my-feature "Feature title"

# Validation
choragen request:validate CR-20251206-001
# Error: Missing implementation chain
# Error: Design chain incomplete

# Skip design for hotfixes
choragen chain:new:impl FR-20251206-001 hotfix "Hotfix" --skip-design="Critical production issue"
```

---

## Data Model Changes

### Chain Metadata (`.chains/*.json`)

```json
{
  "chainId": "CHAIN-007-my-feature",
  "requestId": "CR-20251206-001",
  "title": "My Feature",
  "type": "design",
  "status": "in-progress",
  "dependsOn": null
}
```

```json
{
  "chainId": "CHAIN-008-my-feature-impl",
  "requestId": "CR-20251206-001", 
  "title": "My Feature Implementation",
  "type": "implementation",
  "status": "blocked",
  "dependsOn": "CHAIN-007-my-feature"
}
```

---

## Acceptance Criteria

- [x] Chain type field added to chain metadata
- [x] CLI updated to require/specify chain type
- [x] Validation that requests have design + impl chains
- [x] Implementation chains blocked until design chain done
- [x] `--skip-design` flag with required justification
- [x] `request:validate` command checks chain coverage
- [x] Existing chains migrated (default to `implementation`)

---

## Linked ADRs

- ADR-001-task-file-format (will need update)

---

## Completion Notes

**Completed**: 2025-12-06

Implemented chain types feature:

**Core schema** (`packages/core/src/tasks/types.ts`):
- Added `ChainType = 'design' | 'implementation'`
- Added `type` and `dependsOn` fields to Chain interface

**CLI commands** (`packages/cli/src/cli.ts`):
- `chain:new --type=design|implementation`
- `chain:new:design` shorthand
- `chain:new:impl` shorthand with `--depends-on` and `--skip-design` flags
- `chain:list` and `chain:status` show type

**Validation** (`packages/core/src/validation/chain-types.ts`, `scripts/validate-chain-types.mjs`):
- Validates requests have both design and impl chains
- Checks impl chains blocked until design done
- `request:validate` CLI command

**Migration**: All 14 existing chains migrated with `type` field.

**Task Chain**: CHAIN-014-chain-types (5 tasks completed)
