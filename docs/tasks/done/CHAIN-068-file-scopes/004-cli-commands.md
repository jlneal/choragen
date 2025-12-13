# Task: Add CLI commands for scope viewing and conflict checking

**Chain**: CHAIN-068-file-scopes  
**Task**: 004-cli-commands  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Add CLI commands to view chain file scopes and check for conflicts with other active chains. Commands: `chain:scope <chain-id>` to view a chain's file scope, and `chain:conflicts <chain-id>` to check for conflicts with other active chains.

---

## Expected Files

- `packages/cli/src/cli.ts — Add chain:scope and chain:conflicts commands`
- `packages/cli/src/__tests__/cli.test.ts — Tests for new commands (if test file exists)`

---

## File Scope


---

## Acceptance Criteria

- [ ] choragen chain:scope <chain-id> displays the chain's aggregated file scope
- [ ] choragen chain:conflicts <chain-id> lists chains with overlapping scopes
- [ ] Output is human-readable with clear formatting
- [ ] Commands handle missing chain gracefully
- [ ] Commands handle chains with no file scope gracefully
- [ ] Help text updated for new commands

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
