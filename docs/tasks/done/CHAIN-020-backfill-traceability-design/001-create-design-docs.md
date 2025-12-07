# Task: Create missing design documents

**Chain**: CHAIN-020-backfill-traceability-design  
**Task**: 001-create-design-docs  
**Status**: todo  
**Created**: 2025-12-07

---

## Objective

Create 6 missing design documents for features that were implemented without proper traceability.

---

## Expected Files

- `Create in docs/design/core/features/:`
- `1. agent-workflow.md`
- `2. design-contract.md`
- `3. cli-commands.md`
- `4. eslint-plugin.md`
- `5. validation-pipeline.md`
- `6. chain-types.md`

---

## Acceptance Criteria

- [ ] ### 1. agent-workflow.md
- [ ] Describes the two-agent model (control vs implementation)
- [ ] Explains why separation is needed (context boundaries, review integrity)
- [ ] Documents control agent responsibilities
- [ ] Documents impl agent responsibilities
- [ ] Documents handoff process
- [ ] Links to: docs/agents/*.md as implementation
- [ ] ### 2. design-contract.md
- [ ] Describes DesignContract purpose (runtime traceability)
- [ ] Documents the function wrapper API
- [ ] Documents DesignContractBuilder for advanced use
- [ ] Documents helper functions (isDesignContract, getDesignContractMetadata)
- [ ] Links to: packages/contracts/src/design-contract.ts as implementation
- [ ] ### 3. cli-commands.md
- [ ] Documents CLI command structure
- [ ] Documents chain lifecycle commands (new, list, status)
- [ ] Documents task lifecycle commands (add, ready, start, complete, approve)
- [ ] Documents governance commands
- [ ] Documents lock commands
- [ ] Links to: packages/cli/src/cli.ts as implementation
- [ ] ### 4. eslint-plugin.md
- [ ] Documents rule categories (traceability, contracts, hygiene, test quality)
- [ ] Documents key rules in each category
- [ ] Documents recommended vs strict configs
- [ ] Links to: packages/eslint-plugin/src/index.ts as implementation
- [ ] ### 5. validation-pipeline.md
- [ ] Documents the three enforcement layers (ESLint, Git Hooks, Scripts)
- [ ] Documents each validation script's purpose
- [ ] Documents the run-validators.mjs orchestrator
- [ ] Links to: scripts/*.mjs as implementation
- [ ] ### 6. chain-types.md
- [ ] Documents design vs implementation chain types
- [ ] Documents the chain pairing concept
- [ ] Documents skipDesign flag and when it's appropriate
- [ ] Documents dependsOn for chain dependencies
- [ ] Links to: packages/core/src/tasks/types.ts as implementation

---

## Notes

Reference existing design docs for format:
- `docs/design/core/features/task-chain-management.md`
- `docs/design/core/features/governance-enforcement.md`

Each design doc should follow the same structure:
- Feature title and domain
- Overview/purpose
- Key concepts
- Implementation details
- Linked ADRs (if any)
- Implementation references
