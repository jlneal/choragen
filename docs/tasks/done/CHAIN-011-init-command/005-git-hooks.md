# Task: Create git hooks

**Chain**: CHAIN-011-init-command  
**Task**: 005-git-hooks  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Extend `choragen init` to create git hooks and prompt for installation.

---

## Expected Files

Update:
- `packages/cli/src/commands/init.ts` - Add git hooks creation and installation prompt

---

## Acceptance Criteria

- [ ] Creates githooks/pre-commit
- [ ] Creates githooks/commit-msg
- [ ] Prompts user to install hooks (Y/n)
- [ ] If yes, configures git to use githooks/ directory
- [ ] `--skip-hooks` flag skips prompt and creation

---

## Notes

Reference existing hooks in choragen's githooks/ directory.

Git hook installation: `git config core.hooksPath githooks`

**Verification**:
```bash
pnpm build
```
