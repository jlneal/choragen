# Change Request: Git Integration

**ID**: CR-20251209-022  
**Domain**: dashboard  
**Status**: todo  
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

No commits yet.

---

## Implementation Notes

Use `simple-git` or similar library for git operations. Ensure commit hooks still run (pre-commit validation).

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
