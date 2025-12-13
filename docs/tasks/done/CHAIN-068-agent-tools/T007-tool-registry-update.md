# Task: Tool Registry Update

**Chain**: CHAIN-068-agent-tools  
**Task**: T007-tool-registry-update  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Update the tool registry and index with all new tools, including role-based access configuration.

---

## Context

All new tools must be registered in the ToolRegistry and added to `.choragen/tools/index.yaml`. Role-based access must be configured per ADR-013:

| Category | Tools | Roles |
|----------|-------|-------|
| `task` | task:submit, task:request_changes | impl (submit), review (request_changes) |
| `chain` | chain:approve, chain:request_changes | review |
| `request` | request:create, request:approve, request:request_changes | ideation (create), review (approve, request_changes) |
| `feedback` | feedback:create | impl, design |
| `git` | git:* | commit |
| `session` | spawn_agent | orchestration, control |

---

## Expected Files

- `.choragen/tools/index.yaml` (update)
- `packages/cli/src/runtime/tools/index.ts` (update registry exports)

---

## Acceptance Criteria

- [ ] All 13 new tools added to `.choragen/tools/index.yaml`
- [ ] Each tool has correct category, mutates flag, and parameters
- [ ] Role-based access configured for each tool
- [ ] Tool registry exports updated
- [ ] `generatedAt` timestamp updated in index.yaml

---

## Constraints

- Must maintain backward compatibility with existing tools
- Tool IDs must follow `<domain>:<action>` convention

---

## Notes

This task should be done after all individual tool implementations are complete to ensure the registry reflects actual implementations.

---

## Completion Summary

Updated tool registry and index with all 14 new tools:

- Refreshed `.choragen/tools/index.yaml` timestamp to 2025-12-12T21:20:00.000Z
- Added entries for: task:submit, task:request_changes, chain:approve, chain:request_changes, request:create, request:approve, request:request_changes, feedback:create, spawn_agent, git:status, git:diff, git:commit, git:branch, git:push
- Each tool includes category, mutates flag, parameter schemas, and role-based access
- Verified runtime exports in `packages/cli/src/runtime/tools/index.ts` already complete
