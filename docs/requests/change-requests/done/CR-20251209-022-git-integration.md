# Change Request: Git Integration

**ID**: CR-20251209-022  
**Domain**: dashboard  
**Status**: done  
**Created**: 2025-12-09  
**Owner**: agent  

---

## What

Add Git status display and commit capabilities to the web dashboard.

---

## Why

Currently git operations require terminal access. Web-based git integration enables:

- See uncommitted changes at a glance
- Trigger commits with proper CR/FR references
- View recent commit history
- Ensure commits follow project conventions

---

## Scope

**In Scope**:
- Display git status (modified, staged, untracked files)
- Stage/unstage files
- Commit with message (auto-include CR/FR reference)
- View recent commits
- Show current branch

**Out of Scope**:
- Branch creation/switching
- Push/pull operations
- Merge conflict resolution
- Full git client functionality

---

## Proposed Changes

### New tRPC Procedures

```typescript
git.status()  // Returns { branch, staged, modified, untracked }
git.stage({ files: string[] })
git.unstage({ files: string[] })
git.commit({ message, requestId? })
git.log({ limit: number })
```

### UI Components

- **GitStatus**: Status indicator in header (clean/dirty)
- **GitPanel**: Expandable panel showing changed files
- **CommitDialog**: Modal for commit message with CR/FR selector
- **CommitHistory**: Recent commits list

### Commit Message Helper

Auto-generate commit message format:
```
<type>(<scope>): <description>

[CR-xxx | FR-xxx]
```

---

## Affected Design Documents

- `docs/design/core/features/web-dashboard.md`

---

## Linked ADRs

- ADR-011-web-api-architecture

---

## Commits

- `a393e0c` feat(web): add git integration to dashboard

---

## Implementation Notes

Use `simple-git` or similar library for git operations. Ensure commit hooks still run (pre-commit validation).

---

## Completion Notes

Implemented full git integration for the web dashboard via CHAIN-056:

**Backend (tRPC Router)**:
- `git.status()` — branch, staged, modified, untracked files
- `git.stage({ files })` / `git.unstage({ files })`
- `git.commit({ message, requestId? })` — with hook support
- `git.log({ limit })` — commit history

**UI Components**:
- `GitStatus` — header indicator with branch name and clean/dirty state
- `GitPanel` — file staging with batch operations
- `CommitDialog` — conventional commit message builder with CR/FR selector
- `CommitHistory` — recent commits with reference highlighting and links
- `GitSection` / dedicated `/git` page

**Tests**: 205 total (36 new for git features)

**Dependencies**: `simple-git`, `@radix-ui/react-tooltip`, `@radix-ui/react-label`, `@radix-ui/react-select`
