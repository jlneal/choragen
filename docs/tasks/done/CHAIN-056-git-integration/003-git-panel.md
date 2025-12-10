# Task: Git Panel

**Chain**: CHAIN-056-git-integration  
**Task**: 003-git-panel  
**Type**: impl  
**Status**: done

---

## Objective

Create an expandable GitPanel component showing changed files with stage/unstage actions.

## Acceptance Criteria

- [ ] Create `GitPanel` component with collapsible sections
- [ ] Display staged files with unstage action
- [ ] Display modified files with stage action
- [ ] Display untracked files with stage action
- [ ] Show file paths with appropriate icons
- [ ] Support selecting multiple files for batch operations

## Context

- CR: CR-20251209-022
- Depends on: 001-git-router

## Notes

Group files by status (staged, modified, untracked) with clear visual separation.
