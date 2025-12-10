# Task: Git Status Indicator

**Chain**: CHAIN-056-git-integration  
**Task**: 002-git-status-indicator  
**Type**: impl  
**Status**: done

---

## Objective

Create a GitStatus component that shows clean/dirty indicator in the header.

## Acceptance Criteria

- [ ] Create `GitStatus` component showing current branch name
- [ ] Display visual indicator for clean vs dirty state
- [ ] Show count of changed files when dirty
- [ ] Poll or subscribe for status updates
- [ ] Integrate into dashboard header

## Context

- CR: CR-20251209-022
- Depends on: 001-git-router

## Notes

Keep the indicator minimal - just branch name and a colored dot/badge for status.
