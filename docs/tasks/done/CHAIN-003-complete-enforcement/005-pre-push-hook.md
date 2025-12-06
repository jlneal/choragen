# Task: Add pre-push git hook

**Chain**: CHAIN-003-complete-enforcement  
**Task**: 005-pre-push-hook  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Add a pre-push git hook that runs tests before allowing push. This prevents broken code from reaching the remote.

---

## Expected Files

- `Create:`
- `githooks/pre-push - Pre-push hook script`
- `Update:`
- `githooks/AGENTS.md - Document new hook`

---

## Acceptance Criteria

- [ ] pre-push hook created
- [ ] Hook runs pnpm test
- [ ] Hook runs pnpm build
- [ ] Hook is executable
- [ ] AGENTS.md updated
- [ ] Hook works when pushing

---

## Notes

The pre-push hook should:
1. Run `pnpm build` - Ensure code compiles
2. Run `pnpm test` - Ensure tests pass
3. Exit 1 on failure to block push

Reference: `/Users/justin/Projects/itinerary-planner/githooks/pre-push`

Make sure to:
- Add shebang: `#!/bin/bash`
- Make executable: `chmod +x githooks/pre-push`
- Use colors for output
