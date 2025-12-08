# Fix Request: Enforce Commit Discipline for Completed Requests

**ID**: FR-20251207-003  
**Domain**: core  
**Status**: done  
**Severity**: medium  
**Created**: 2025-12-07  
**Owner**: agent  

---

## Problem

Completed requests (CRs/FRs moved to `done/`) accumulate uncommitted changes because:
1. No enforcement mechanism reminds agents to commit
2. The control task checklist mentions commit format but doesn't block
3. Agents move on to the next task without committing

This leads to large, multi-request commits that are harder to review and bisect.

---

## Impact

- **Lost traceability** — Can't easily see which commit implemented which request
- **Harder reviews** — Large commits are harder to review
- **Bisect difficulty** — Can't pinpoint when a bug was introduced
- **Process violation** — The documented workflow says "commit after each request"

---

## Proposed Fix

### 1. Validation Script: `validate-uncommitted-requests.mjs`

Check if there are uncommitted changes AND completed requests that haven't been committed:
- Scan `docs/requests/*/done/` for requests
- Check git log for commits referencing those request IDs
- Warn if a done request has no matching commit

### 2. Pre-push Hook Enhancement

Block push if:
- There are uncommitted changes
- AND there are requests in `done/` without corresponding commits

### 3. Control Task Template Update

Add explicit step: "Commit all changes with proper CR/FR reference before closing"

---

## Acceptance Criteria

- [x] `validate-uncommitted-requests.mjs` exists and detects the problem
- [x] Pre-push hook blocks push when uncommitted request work exists
- [x] Control task template includes commit reminder
- [x] Clear error message explains what to do

---

## Implementation Notes

### Pre-push Hook Logic

```bash
# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  # Check for done requests without commits
  for request in docs/requests/*/done/*.md; do
    id=$(grep -oE "(CR|FR)-[0-9]{8}-[0-9]{3}" "$request" | head -1)
    if ! git log --oneline | grep -q "$id"; then
      echo "❌ Request $id is done but not committed"
      exit 1
    fi
  done
fi
```

### Also Fix

The pre-commit hook runs `validate-design-doc-content.mjs` on ALL design docs, not just staged ones. This should be fixed to only validate staged files.

---

## Completion Notes

**Completed**: 2025-12-07

### Implementation Summary

Implemented via CHAIN-028-commit-discipline:

**Created**:
- `scripts/validate-uncommitted-requests.mjs` — Detects done requests without matching commits

**Updated**:
- `githooks/pre-push` — Blocks push when uncommitted request work exists
- `scripts/AGENTS.md` — Documented new validator

### Behavior

1. Validator checks `git status --porcelain` for uncommitted changes
2. If changes exist, scans `docs/requests/*/done/*.md` for completed requests
3. For each request, checks `git log --grep` for matching commit
4. Fails if any done request has no commit referencing its ID

### Note

Legacy requests completed before this enforcement will need a catch-up commit to satisfy the validator.
