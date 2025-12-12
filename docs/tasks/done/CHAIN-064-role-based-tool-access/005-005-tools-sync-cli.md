# Task: Create choragen tools:sync CLI command

**Chain**: CHAIN-064-role-based-tool-access  
**Task**: 005-005-tools-sync-cli  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Create the `choragen tools:sync` CLI command that extracts tool metadata from the registry and writes to `.choragen/tools/index.yaml`.

---

## Expected Files

- `packages/cli/src/commands/tools/sync.ts - Command implementation`
- `packages/cli/src/commands/tools/index.ts - Command group export`
- `packages/cli/src/index.ts - Register tools command group`

---

## Acceptance Criteria

- [ ] choragen tools:sync command implemented
- [ ] Command behavior:
- [ ] - Imports defaultRegistry from packages/cli/src/runtime/tools/registry.ts
- [ ] - Uses ToolMetadataExtractor from @choragen/core
- [ ] - Extracts metadata from all registered tools
- [ ] - Writes to .choragen/tools/index.yaml
- [ ] - Also writes default categories to .choragen/tools/categories.yaml
- [ ] Output format:
- [ ] Syncing tool metadata...
- [ ] Found 11 tools
- [ ] Wrote .choragen/tools/index.yaml
- [ ] Wrote .choragen/tools/categories.yaml
- [ ] Done.
- [ ] --json flag for machine-readable output
- [ ] Command registered in CLI help
- [ ] pnpm build passes
- [ ] pnpm --filter @choragen/cli test passes
- [ ] pnpm lint passes

---

## Constraints

- Follow existing CLI command patterns in packages/cli/src/commands/
- Use commander for argument parsing (already in dependencies)
- Exit code 0 on success, 1 on error

---

## Notes

Reference existing commands like `packages/cli/src/commands/chain/status.ts` for patterns.

The command should be run manually or as part of a build step. It's not automatically triggered.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
