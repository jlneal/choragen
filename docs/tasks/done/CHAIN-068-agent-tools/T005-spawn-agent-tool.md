# Task: Spawn Agent Tool

**Chain**: CHAIN-068-agent-tools  
**Task**: T005-spawn-agent-tool  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Implement the generic `spawn_agent` tool for role-flexible agent spawning.

---

## Context

The existing `spawn_impl_session` tool is specific to impl agents. The orchestration workflow needs a generic tool that can spawn any agent role. Per ADR-013:
- `spawn_agent` creates an agent session with specified role config
- Injects context (chain, task, additional instructions)
- Returns when spawned agent completes or errors

---

## Expected Files

- `packages/cli/src/runtime/tools/session-tools.ts` (extend existing or create)
- `packages/cli/src/runtime/tools/__tests__/session-tools.test.ts`

---

## Acceptance Criteria

- [ ] `spawn_agent` tool implemented with parameters: `{ role, chainId?, taskId?, context? }`
- [ ] Supports spawning any defined role (impl, design, review, ideation, commit, orchestration)
- [ ] Spawned agent receives appropriate tool set for its role
- [ ] Parent session pauses while child executes
- [ ] Child session result returned to parent
- [ ] Tool registered with `orchestration` and `control` role access
- [ ] Unit tests for spawning different roles

---

## Constraints

- Must integrate with existing session management from ADR-010
- Role must be validated against defined roles
- Cannot spawn a role with higher privileges than current session

---

## Notes

Review existing `spawn_impl_session` implementation. This tool may replace or wrap it.

---

## Completion Summary

Implemented generic spawn_agent tool with role-flexible nested sessions:

- Added `spawn_agent` tool in `packages/cli/src/runtime/tools/session-tools.ts`
- Supports all defined roles: impl, design, review, ideation, commit, orchestration, control
- Role validation with privilege escalation guard (non-control roles cannot spawn higher-privilege roles)
- Depth limit enforcement prevents infinite nesting
- Extended nested session plumbing to carry role/roleId through child spawns
- Wired into executor.ts, registry.ts, index.ts
- Added unit tests covering spawn scenarios, privilege guard, and depth limit
