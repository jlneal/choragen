# Task: Add Task Runner Infrastructure

**Chain**: CHAIN-016-agentic-chassis  
**Task**: 007-task-runner  
**Type**: implementation  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Create a task runner (`scripts/run.mjs`) that wraps all commands with a consistent interface and provides JSON output for agent consumption.

---

## Reference

See `/Users/justin/Projects/itinerary-planner/scripts/run.mjs` for the target pattern.

---

## Expected Files

Create:
- `scripts/run.mjs`
- `scripts/run.d.mts` (type definitions)

---

## Commands to Support

```bash
# Build & Test
node scripts/run.mjs build
node scripts/run.mjs test
node scripts/run.mjs typecheck
node scripts/run.mjs lint

# Validation
node scripts/run.mjs validate:all
node scripts/run.mjs validate:links
node scripts/run.mjs validate:adr
# ... all validate commands

# Planning
node scripts/run.mjs cr:new <slug>
node scripts/run.mjs fr:new <slug>
node scripts/run.mjs adr:new <slug>

# Utilities
node scripts/run.mjs work:incomplete
node scripts/run.mjs pre-push
```

---

## Implementation Notes

1. **Command Registry**:
   ```javascript
   const commands = {
     build: () => spawn("pnpm", ["build"]),
     test: () => spawn("pnpm", ["test"]),
     "validate:all": () => runValidators(ALL_VALIDATORS),
     // ...
   };
   ```

2. **Consistent Output**:
   - Exit code 0 = success, 1 = failure
   - JSON output to stdout when `--json` flag
   - Human-readable output by default

3. **Help Command**:
   ```bash
   node scripts/run.mjs help
   # Lists all available commands
   ```

4. **Error Handling**:
   - Catch and format errors
   - Always exit with appropriate code

---

## Acceptance Criteria

- [ ] `scripts/run.mjs` exists and is executable
- [ ] `node scripts/run.mjs help` lists commands
- [ ] `node scripts/run.mjs build` runs pnpm build
- [ ] `node scripts/run.mjs validate:all` runs validators
- [ ] Exit codes are correct
- [ ] `--json` flag outputs JSON

---

## Verification

```bash
node scripts/run.mjs help
node scripts/run.mjs build
node scripts/run.mjs validate:all
node scripts/run.mjs validate:links --json
```
