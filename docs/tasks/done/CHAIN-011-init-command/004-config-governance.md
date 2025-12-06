# Task: Create config and governance files

**Chain**: CHAIN-011-init-command  
**Task**: 004-config-governance  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Extend `choragen init` to create .choragen/config.yaml and choragen.governance.yaml.

---

## Expected Files

Update:
- `packages/cli/src/commands/init.ts` - Add config file creation

---

## Acceptance Criteria

- [ ] Creates .choragen/config.yaml with project settings
- [ ] Creates choragen.governance.yaml with default governance rules
- [ ] Config includes project name and domain

---

## Notes

Reference existing templates:
- `templates/choragen.config.js`
- `templates/choragen.governance.yaml`

**Verification**:
```bash
pnpm build
```
