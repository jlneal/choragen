# Task: Git tRPC Router

**Chain**: CHAIN-056-git-integration  
**Task**: 001-git-router  
**Type**: impl  
**Status**: done

---

## Objective

Create the git tRPC router with procedures for status, stage, unstage, commit, and log.

## Acceptance Criteria

- [ ] Create `git.status()` procedure returning `{ branch, staged, modified, untracked }`
- [ ] Create `git.stage({ files: string[] })` procedure
- [ ] Create `git.unstage({ files: string[] })` procedure
- [ ] Create `git.commit({ message, requestId? })` procedure
- [ ] Create `git.log({ limit: number })` procedure
- [ ] Use `simple-git` library for git operations
- [ ] Ensure commit hooks still run (pre-commit validation)

## Context

- CR: CR-20251209-022
- ADR: ADR-011-web-api-architecture
- Design: docs/design/core/features/web-dashboard.md

## Notes

The router should follow the same patterns as existing tRPC routers in the web package.
