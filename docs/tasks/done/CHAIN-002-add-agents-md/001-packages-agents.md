# Task: Add AGENTS.md to each package

**Chain**: CHAIN-002-add-agents-md  
**Task**: 001-packages-agents  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Create AGENTS.md files for each package in the monorepo. Each file should explain:
- Package purpose
- Key exports and APIs
- Coding conventions
- Common patterns
- Related ADRs

---

## Expected Files

- `packages/core/AGENTS.md`
- `packages/cli/AGENTS.md`
- `packages/contracts/AGENTS.md`
- `packages/eslint-plugin/AGENTS.md`
- `packages/test-utils/AGENTS.md`

---

## Acceptance Criteria

- [ ] Each package has an AGENTS.md file
- [ ] Each file explains the package purpose
- [ ] Each file lists key exports
- [ ] Each file references relevant ADRs
- [ ] Files follow the pattern from root AGENTS.md

---

## Notes

Reference the root AGENTS.md for style. Key ADR mappings:
- `core` → ADR-001 (tasks), ADR-002 (governance), ADR-003 (locks)
- `cli` → ADR-001 (task commands)
- `contracts` → ADR-002 (DesignContract)
- `eslint-plugin` → ADR-002 (enforcement)
- `test-utils` → ADR-002 (unsafeCast)

Example structure:
```markdown
# @choragen/package-name
