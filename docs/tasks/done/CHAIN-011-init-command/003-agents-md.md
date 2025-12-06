# Task: Create AGENTS.md files

**Chain**: CHAIN-011-init-command  
**Task**: 003-agents-md  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Extend `choragen init` to create AGENTS.md files with project-specific content.

---

## Expected Files

Update:
- `packages/cli/src/commands/init.ts` - Add AGENTS.md creation

---

## Acceptance Criteria

- [ ] Creates root AGENTS.md with project name
- [ ] Creates docs/AGENTS.md
- [ ] Creates githooks/AGENTS.md
- [ ] Creates templates/AGENTS.md
- [ ] Project name is configurable (from prompt or flag)

---

## Notes

Use choragen's own AGENTS.md files as reference templates.

**Verification**:
```bash
pnpm build
```
