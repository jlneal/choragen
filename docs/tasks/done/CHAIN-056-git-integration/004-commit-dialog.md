# Task: Commit Dialog

**Chain**: CHAIN-056-git-integration  
**Task**: 004-commit-dialog  
**Type**: impl  
**Status**: done

---

## Objective

Create a CommitDialog modal for composing commit messages with CR/FR reference selector.

## Acceptance Criteria

- [ ] Create `CommitDialog` modal component
- [ ] Include commit type selector (feat, fix, docs, test, refactor, chore)
- [ ] Include scope input field
- [ ] Include description input field
- [ ] Include CR/FR selector dropdown (populated from active requests)
- [ ] Auto-generate commit message in project format
- [ ] Preview formatted commit message
- [ ] Submit triggers git.commit procedure

## Context

- CR: CR-20251209-022
- Depends on: 001-git-router, 003-git-panel

## Notes

Commit message format:
```
<type>(<scope>): <description>

[CR-xxx | FR-xxx]
```
