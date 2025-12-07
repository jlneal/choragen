# Fix Request: Add CLI Command to Close Requests with Commit Traceability

**ID**: FR-20251207-004  
**Domain**: cli  
**Status**: done  
**Severity**: medium  
**Created**: 2025-12-07  
**Completed**: 2025-12-07
**Owner**: agent  

---

## Problem

The traceability chain is incomplete:
- Commits reference requests (CR/FR ID in commit message) ✅
- Requests don't list their implementing commits ❌

The `## Commits

- 9dd0233 feat(cli): add request:close command

## Impact

- **Incomplete traceability** — Can't see commits from the request doc
- **Manual process** — Moving requests to done is error-prone
- **Documentation gap** — Request docs aren't self-contained

---

## Proposed Fix

Add `choragen request:close <request-id>` CLI command that:

1. Finds the request file (in todo/ or doing/)
2. Queries `git log --grep="<request-id>"` for commits
3. Populates the `## Commits` section with commit hashes and messages
4. Updates status to `done`
5. Moves the file to `done/`

### Usage

```bash
choragen request:close CR-20251207-002
```

### Output

```
Closing CR-20251207-002...
  Found 2 commits:
    57b4d7b feat: user value traceability, expanded ADR coverage, CI pipeline
    03f5138 chore: backfill commit references for legacy requests
  Updated ## Commits section
  Moved to docs/requests/change-requests/done/
✅ Request closed
```

---

## Acceptance Criteria

- [ ] `choragen request:close <id>` command exists
- [ ] Finds request in todo/ or doing/
- [ ] Queries git log for commits referencing the request
- [ ] Populates ## Commits section with commit list
- [ ] Updates status to done
- [ ] Moves file to done/
- [ ] Errors gracefully if request not found or no commits

---

## Implementation Notes

### Commit Format in Request

```markdown
## Commits

- `57b4d7b` feat: user value traceability, expanded ADR coverage, CI pipeline
- `03f5138` chore: backfill commit references for legacy requests
```

### Edge Cases

- Request has no commits yet → Error: "No commits found. Commit your work first."
- Request already in done/ → Error: "Request already closed"
- Request not found → Error: "Request not found: CR-xxx"

---

## Completion Notes

[Added when moved to done/]
