# Fix Request: Enforce Commit Before Starting Next Request

**ID**: FR-20251207-008  
**Domain**: workflow  
**Status**: todo  
**Severity**: medium  
**Created**: 2025-12-07  
**Owner**: agent  

---

## Problem

Agents can move a request to `done/` and start the next request without committing changes from the completed request. This breaks the traceability chain:
- Commits should reference the CR/FR ID
- CR/FR docs should list their implementing commits (via `request:close`)

**Observed**: CR-20251207-001 was completed and moved to `done/`, then CR-20251206-011 was started—all without committing the CR-001 changes.

## Impact

- Lost commit-to-request traceability
- `request:close` cannot populate the Commits section accurately
- Multiple requests' changes may be conflated in a single commit
- Harder to revert or cherry-pick individual request changes

## Proposed Fix

### 1. Document in Agent Guidelines (Immediate)

Add to `AGENTS.md` under a new "## Commit Discipline" section:

```markdown
## Commit Discipline

Before starting a new request:
1. Commit all changes from the current request
2. Commit message must reference the request ID (e.g., `[CR-20251207-001]`)
3. Run `choragen request:close <id>` to move request to done and populate commits
4. Only then start the next request
```

### 2. CLI Warning (Short-term)

Enhance `request:close` to warn about uncommitted changes:

```bash
$ choragen request:close CR-20251207-001
⚠️  Warning: You have 4 uncommitted files. 
   Commit changes before closing to ensure proper traceability.
   Continue anyway? (y/N)
```

### 3. Git Hook (Optional, Stronger)

Add a commit-msg hook that warns if:
- A request is in `doing/` status
- The commit message doesn't reference that request ID

## Acceptance Criteria

- [ ] `AGENTS.md` documents commit-before-next-request rule
- [ ] `docs/agents/control-agent.md` updated with commit checkpoint
- [ ] `request:close` warns if uncommitted changes exist
- [ ] (Optional) commit-msg hook validates request ID reference

## Affected Components

| Component | Change |
|-----------|--------|
| `AGENTS.md` | Add Commit Discipline section |
| `docs/agents/control-agent.md` | Add commit checkpoint to workflow |
| `@choragen/cli` | Add uncommitted changes warning to `request:close` |
| `githooks/commit-msg` | (Optional) Add request ID validation |

---

## Commits

[Populated by `choragen request:close`]
