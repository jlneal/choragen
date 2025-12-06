# Task: Add interactive mode

**Chain**: CHAIN-011-init-command  
**Task**: 006-interactive-mode  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add interactive prompts for customization during `choragen init`.

---

## Expected Files

Update:
- `packages/cli/src/commands/init.ts` - Add interactive prompts

---

## Acceptance Criteria

- [ ] Prompts for project name (default: directory name)
- [ ] Prompts for primary domain (default: "core")
- [ ] Prompts for git hooks installation (Y/n)
- [ ] `--non-interactive` flag uses defaults
- [ ] `--domain=<name>` flag sets domain without prompt

---

## Notes

Use a simple readline-based prompt or a library like `inquirer` if already available.

**Verification**:
```bash
pnpm build
choragen init --non-interactive
```
