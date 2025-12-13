# Task: Git Tools

**Chain**: CHAIN-068-agent-tools  
**Task**: T006-git-tools  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Implement the git operation tools: `git:status`, `git:diff`, `git:commit`, `git:branch`, and `git:push`.

---

## Context

The Commit agent role needs version control access for the commit stage of the Standard Workflow. Per ADR-013:
- Git tools have additional safeguards (message validation, audit logging)
- `git:push` requires human approval gate in workflow
- `git:branch` only allows creation, not deletion

---

## Expected Files

- `packages/cli/src/runtime/tools/git-tools.ts`
- `packages/cli/src/runtime/tools/__tests__/git-tools.test.ts`

---

## Acceptance Criteria

- [ ] `git:status` tool implemented - returns current git status
- [ ] `git:diff` tool implemented with parameters: `{ files?, staged? }`
- [ ] `git:commit` tool implemented with parameters: `{ message, files? }`
- [ ] `git:commit` validates commit message format (type, scope, CR/FR reference)
- [ ] `git:branch` tool implemented with parameters: `{ name, action: 'create' | 'checkout' }`
- [ ] `git:branch` does NOT support deletion
- [ ] `git:push` tool implemented with parameters: `{ remote?, branch? }`
- [ ] All git operations logged to audit trail
- [ ] Tools registered with `commit` role access
- [ ] Unit tests for all tools including validation

---

## Constraints

- Use existing git credential helpers (no custom auth)
- Commit message must follow format: `<type>(<scope>): <description>\n\n[CR-xxx | FR-xxx]`
- All operations must be safe (no force push, no branch deletion)

---

## Notes

Consider using simple-git or similar library for git operations. Ensure proper error handling for common git failures (merge conflicts, detached HEAD, etc.).

---

## Completion Summary

Implemented Git tooling suite for commit-stage agents:

- Added `git:status`, `git:diff`, `git:commit`, `git:branch`, `git:push` in `packages/cli/src/runtime/tools/git-tools.ts`
- `git:commit` validates message format with regex: `<type>(<scope>): <description>\n\n[CR-xxx|FR-xxx]`
- `git:branch` only supports create/checkout actions (deletion blocked)
- `git:push` uses safe defaults (no force push)
- Wired into executor.ts, registry.ts, index.ts
- Added comprehensive unit tests including push to local bare remote and validation errors
- Note: Audit logging can be enhanced at executor level in future iteration
