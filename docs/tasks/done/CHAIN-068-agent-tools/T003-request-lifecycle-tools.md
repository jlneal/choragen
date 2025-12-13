# Task: Request Lifecycle Tools

**Chain**: CHAIN-068-agent-tools  
**Task**: T003-request-lifecycle-tools  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Implement the request lifecycle tools: `request:create`, `request:approve`, and `request:request_changes`.

---

## Context

The Ideation Workflow uses `request:create` to generate CR/FR documents in the backlog. The Standard Workflow uses `request:approve` and `request:request_changes` for final request review. Per ADR-013:
- `request:create` creates a request doc from template in backlog
- `request:approve` marks request as approved, emits `request.approved` event
- `request:request_changes` requests changes on request, emits `request.changes_requested` event

---

## Expected Files

- `packages/cli/src/runtime/tools/request-tools.ts`
- `packages/cli/src/runtime/tools/__tests__/request-tools.test.ts`

---

## Acceptance Criteria

- [ ] `request:create` tool implemented with parameters: `{ type: 'cr' | 'fr', title, domain, content }`
- [ ] `request:create` generates request doc using template
- [ ] `request:create` places doc in `docs/requests/{type}-requests/backlog/`
- [ ] `request:approve` tool implemented with parameters: `{ requestId, reason? }`
- [ ] `request:approve` emits `request.approved` event
- [ ] `request:request_changes` tool implemented with parameters: `{ requestId, reason }`
- [ ] `request:request_changes` emits `request.changes_requested` event
- [ ] Tools registered with appropriate role access (ideation for create, review for approve/changes)
- [ ] Unit tests for all three tools

---

## Constraints

- `request:create` must use existing templates from `templates/`
- Request IDs must follow naming convention: `CR-YYYYMMDD-NNN` or `FR-YYYYMMDD-NNN`

---

## Notes

The backlog directory may need to be created if it doesn't exist. Check current request directory structure.

---

## Completion Summary

Implemented request lifecycle tooling end-to-end:

- Added `request:create`, `request:approve`, `request:request_changes` in `packages/cli/src/runtime/tools/request-tools.ts`
- `request:create` handles ID generation (CR/FR-YYYYMMDD-NNN), template loading, placeholder replacement, and file creation in backlog
- Emits `request.created`, `request.approved`, `request.changes_requested` events
- Validates request existence before approve/changes operations
- Wired into executor.ts, registry.ts, index.ts
- Stage matrix updated for request and review access
- Added unit tests in `packages/cli/src/runtime/tools/__tests__/request-tools.test.ts`
