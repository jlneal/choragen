# Fix Request: Define Chain Requirements Policy

**ID**: FR-20251207-007  
**Domain**: docs  
**Status**: doing  
**Severity**: low  
**Created**: 2025-12-07  
**Owner**: agent  

---

## Problem

We skipped creating task chains for FR-20251207-005 and FR-20251207-006. The work got done, but this sets a precedent that could erode discipline over time.

Currently there's no documented policy for when task chains are required vs. optional.

## Impact

Without clear policy:
- Inconsistent chain usage
- Lost traceability for some work
- Harder to measure process metrics
- Confusion about when to create chains

## Proposed Fix

Document a clear policy in governance or AGENTS.md:

### Proposed Policy

**Chains are REQUIRED when**:
- Work spans multiple sessions
- Work involves multiple agents (control + impl handoffs)
- Work affects core packages (`@choragen/core`, `@choragen/cli`)
- CR/FR has more than 2 acceptance criteria

**Chains are OPTIONAL when**:
- Single-session documentation updates
- Simple config changes
- Work is entirely within one file
- FR severity is "low" and scope is trivial

**When skipping a chain**:
- Note in the request: "Chain skipped: [reason]"
- Commit message must still reference the request ID

### Implementation

1. Add policy to `AGENTS.md` under new "## Chain Policy" section
2. Add policy to `docs/agents/control-agent.md`
3. Consider: validation script to warn when chain might be needed

## Acceptance Criteria

- [x] Chain policy documented in `AGENTS.md`
- [x] Control agent guide updated with policy
- [x] FR-005 and FR-006 annotated with "Chain skipped" note (retroactive)

---

## Commits

[Populated by `choragen request:close`]
