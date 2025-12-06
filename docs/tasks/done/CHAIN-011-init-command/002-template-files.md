# Task: Create template files

**Chain**: CHAIN-011-init-command  
**Task**: 002-template-files  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Extend `choragen init` to create template files in the templates/ directory.

---

## Expected Files

Update:
- `packages/cli/src/commands/init.ts` - Add template file creation

---

## Acceptance Criteria

- [ ] Creates templates/task.md
- [ ] Creates templates/change-request.md
- [ ] Creates templates/fix-request.md
- [ ] Creates templates/adr.md
- [ ] Creates templates/feature.md
- [ ] Templates match existing templates in choragen repo

---

## Notes

Copy template content from `/Users/justin/Projects/choragen/templates/`.

**Verification**:
```bash
pnpm build
```
