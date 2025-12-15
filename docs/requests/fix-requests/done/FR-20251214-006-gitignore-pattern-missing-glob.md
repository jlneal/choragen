# Fix Request: Gitignore Pattern Missing Glob for Subdirectories

**ID**: FR-20251214-006  
**Domain**: tooling  
**Status**: done  
**Severity**: high  
**Created**: 2025-12-14  
**Owner**: agent  

---

## What

The `.gitignore` patterns for `.choragen/` config files only matched at the repository root, not in subdirectories like `packages/web/.choragen/`.

---

## Error

GitHub push protection blocked a push due to an exposed OpenAI API key in `packages/web/.choragen/config.json` (commit `492d648`).

---

## Why

The gitignore patterns used:
```
.choragen/session.json
.choragen/sessions/
.choragen/config.json
```

These patterns only match `.choragen/` at the root level. Files in subdirectories like `packages/web/.choragen/config.json` were not ignored and got committed.

---

## Scope

**In Scope**:
- Fix gitignore patterns to match `.choragen/` in any directory
- Remove exposed file from git history

**Out of Scope**:
- API key rotation (user responsibility)

---

## Acceptance Criteria

- [x] Gitignore uses `**/.choragen/` glob pattern
- [x] `packages/web/.choragen/config.json` removed from git history
- [x] Push to GitHub succeeds

---

## Affected Files

- `.gitignore` — Updated patterns to use `**/` prefix

---

## Completion Notes

**Completed**: 2025-12-14

Fixed `.gitignore` patterns from:
```
.choragen/session.json
.choragen/sessions/
.choragen/config.json
```

To:
```
**/.choragen/session.json
**/.choragen/sessions/
**/.choragen/config.json
```

Used `git filter-branch` to remove `packages/web/.choragen/config.json` from entire git history, then force-pushed to GitHub.

**Commit**: `bf6d477` (force push after history rewrite)
