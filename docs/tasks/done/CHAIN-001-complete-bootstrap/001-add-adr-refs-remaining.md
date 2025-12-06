# Task: Add ADR references to remaining source files

**Chain**: CHAIN-001-complete-bootstrap  
**Task**: 001-add-adr-refs-remaining  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add `// ADR: ADR-XXX-name` comments to all source files that are missing them.
Run `pnpm validate:adr-traceability` to see which files need references.

---

## Expected Files

- `packages/core/src/utils/glob.ts → ADR-002-governance-schema`
- `packages/cli/src/bin.ts → ADR-001-task-file-format`
- `packages/cli/src/cli.ts → ADR-001-task-file-format`
- `packages/contracts/src/api-error.ts → ADR-002-governance-schema`
- `packages/contracts/src/design-contract.ts → ADR-002-governance-schema`
- `packages/contracts/src/http-status.ts → ADR-002-governance-schema`
- `packages/contracts/src/types.ts → ADR-002-governance-schema`
- `packages/eslint-plugin/src/rules/require-adr-reference.ts → ADR-002-governance-schema`
- `packages/eslint-plugin/src/rules/require-test-metadata.ts → ADR-002-governance-schema`

---

## Acceptance Criteria

- [ ] All source files (except index.ts, tests, vitest.config) have ADR reference
- [ ] pnpm validate:adr-traceability shows no warnings for source files
- [ ] Build passes: pnpm build

---

## Notes

ADR mapping:
- Task/chain files → ADR-001-task-file-format
- Governance/contracts/eslint → ADR-002-governance-schema  
- Lock files → ADR-003-file-locking
