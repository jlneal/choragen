# Task: Add request:create Tool for Ideation Agent

**Chain**: CHAIN-071-ideation-workflow  
**Task**: T004  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Implement the `request:create` tool that allows the Ideation agent to create change request documents in the backlog directory.

---

## Context

The Ideation agent needs a tool to create CR documents based on approved proposals. The tool should:
- Create CR markdown files following the template
- Output to `docs/requests/change-requests/backlog/` (not todo/)
- Support creating multiple requests from a single ideation session
- Generate appropriate CR IDs

Design doc: `docs/design/core/features/ideation-workflow.md` (see Creation stage)
Ideation role: `docs/design/core/features/specialized-agent-roles.md` (lines 91-122)

---

## Expected Files

- `packages/cli/src/commands/request.ts` (new or extend existing)
- `packages/core/src/requests/` (if request management module needed)

---

## Acceptance Criteria

- [ ] `request:create` command/tool implemented
- [ ] Creates CR files in `docs/requests/change-requests/backlog/`
- [ ] Uses CR template format with proper ID generation
- [ ] Accepts title, description, scope, and priority as inputs
- [ ] Returns created file path for confirmation
- [ ] Build passes
- [ ] Tests added for request creation

---

## Constraints

- Must follow existing CR template format (`templates/change-request.md`)
- CR ID format: `CR-YYYYMMDD-NNN`
- Output to backlog/, not todo/ — commitment is a separate decision

---

## Notes

The tool should be callable by the Ideation agent during the creation stage. It may be implemented as:
- A CLI command (`choragen request:create`)
- A tool definition in the agent tools system
- Both (CLI wrapping core functionality)

Check existing request-related code for patterns to follow.
