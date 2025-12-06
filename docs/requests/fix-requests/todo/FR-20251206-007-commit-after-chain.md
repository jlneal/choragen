# Fix Request: Add Commit Policy After Chain Completion

**ID**: FR-20251206-007  
**Domain**: core  
**Status**: todo  
**Severity**: medium  
**Created**: 2025-12-06  
**Owner**: Justin  

---

## Problem

There's no documented policy for when commits should occur. Work accumulates across multiple chains without being committed, risking loss and making history unclear.

---

## Evidence

Session on 2025-12-06 completed 4 chains (CHAIN-011 verify, CHAIN-013, CHAIN-012, CHAIN-014) without any commits. All work remained uncommitted until manually noticed.

---

## Root Cause

AGENTS.md defines control agent responsibilities but doesn't include committing as part of the workflow.

---

## Proposed Fix

1. Add commit policy to AGENTS.md: "Commit after chain completion"
2. Document commit message format for chains
3. Control agent commits after moving all tasks to done, before starting next chain

---

## Commit Message Format

```
<type>(<scope>): complete <CHAIN-ID>

- Task 1 summary
- Task 2 summary
- ...

<CR-xxx | FR-xxx>
```

---

## Acceptance Criteria

- [ ] AGENTS.md updated with commit policy
- [ ] Commit message format documented
- [ ] Clear that control agent owns commits (not impl agent)

---

## Linked ADRs

- None

---

## Completion Notes

[To be added when moved to done/]
