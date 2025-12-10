# Task: Backlog Infrastructure

**Chain**: CHAIN-049  
**Task**: T001  
**Type**: impl  
**Status**: done  
**Request**: CR-20251209-024  

---

## Objective

Set up the foundational infrastructure for the backlog feature: directories and request parser updates.

---

## Acceptance Criteria

1. Create `docs/requests/change-requests/backlog/` directory with `.gitkeep`
2. Create `docs/requests/fix-requests/backlog/` directory with `.gitkeep`
3. Update request parser to recognize `backlog` as a valid status
4. Update `requests.list` to include backlog requests
5. Add `backlog` option to status filter in request listing

---

## Implementation Guide

### 1. Create Directories

```bash
mkdir -p docs/requests/change-requests/backlog
mkdir -p docs/requests/fix-requests/backlog
touch docs/requests/change-requests/backlog/.gitkeep
touch docs/requests/fix-requests/backlog/.gitkeep
```

### 2. Update Request Parser

In `packages/web/src/server/routers/requests.ts`:

- Add `backlog` to the status type/enum
- Update `getRequestsFromDir` to scan `backlog/` directory
- Include backlog in the directories scanned by `requests.list`

### 3. Update Status Filter

Ensure the status filter dropdown includes `backlog` as an option.

---

## Files to Modify

- `packages/web/src/server/routers/requests.ts` — Add backlog to status, scan backlog dir

## Files to Create

- `docs/requests/change-requests/backlog/.gitkeep`
- `docs/requests/fix-requests/backlog/.gitkeep`

---

## Notes

This task sets up infrastructure only. Promote/demote operations are in T002.
