# Task: Add trace command to CLI

**Chain**: CHAIN-034-trace-impl  
**Task**: 004-cli-command  
**Status**: done  
**Created**: 2025-12-08  
**Type**: impl

---

## Objective

Add the `choragen trace` command to the CLI that uses TraceEngine and formatters from `@choragen/core`.

---

## Context

- **Design doc**: `docs/design/core/features/trace-command.md`
- **CLI Interface section**: lines 22-115
- **Depends on**: Tasks 001-003 (TraceEngine, parsers, formatters) — all complete

The core implementation is done. This task wires it up to the CLI.

---

## Expected Files

```
packages/cli/src/commands/trace.ts    # New command implementation
```

Also modify:
- `packages/cli/src/cli.ts` — register the trace command

---

## Acceptance Criteria

- [x] Create `packages/cli/src/commands/trace.ts` with command handler
- [x] Register command in `packages/cli/src/cli.ts` commands object
- [x] Support positional argument: `<artifact-path-or-id>`
- [x] Support options from design doc:
  - `--format=<tree|json|markdown>` (default: tree)
  - `--direction=<both|upstream|downstream>` (default: both)
  - `--depth=<n>` (default: unlimited)
  - `--no-color` (disable ANSI colors)
- [x] Handle errors gracefully (file not found, invalid ID)
- [x] Add `// @design-doc` comment
- [x] Rebuild CLI: `pnpm --filter @choragen/cli build`

---

## Reference

Design doc CLI interface: lines 22-115

Usage examples from design doc:
```bash
choragen trace packages/core/src/tasks/chain-manager.ts
choragen trace CR-20251206-011
choragen trace ADR-001-task-file-format --format=json
choragen trace CHAIN-033 --format=markdown
```

Existing command patterns:
- `packages/cli/src/commands/` — other command implementations
- `packages/cli/src/cli.ts` — command registration pattern

---

## Verification

```bash
# Rebuild CLI
pnpm --filter @choragen/cli build

# Test the command
node packages/cli/dist/bin.js trace --help
node packages/cli/dist/bin.js trace packages/core/src/trace/trace-engine.ts
node packages/cli/dist/bin.js trace CR-20251206-011 --format=json
```

---

## Notes

This is the user-facing command. Make error messages helpful and output clean.
