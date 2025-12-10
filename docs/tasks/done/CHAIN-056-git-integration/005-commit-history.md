# Task: Commit History

**Chain**: CHAIN-056-git-integration  
**Task**: 005-commit-history  
**Type**: impl  
**Status**: done

---

## Objective

Create a CommitHistory component showing recent commits.

## Acceptance Criteria

- [ ] Create `CommitHistory` component
- [ ] Display recent commits (configurable limit, default 10)
- [ ] Show commit hash (abbreviated), message, author, date
- [ ] Highlight commits with CR/FR references
- [ ] Link CR/FR references to request browser

## Context

- CR: CR-20251209-022
- Depends on: 001-git-router

## Notes

Keep the history view simple - this is not a full git log viewer.
