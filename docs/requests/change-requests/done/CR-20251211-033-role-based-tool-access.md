# Change Request: Role-Based Tool Access

**ID**: CR-20251211-033  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Introduce dynamic roles as first-class entities that define which tools an agent can use. Replace the hardcoded `AgentRole` enum (`"control" | "impl"`) with a flexible, user-configurable system stored in `.choragen/roles/`.

Key deliverables:
- `RoleManager` in `@choragen/core` for CRUD operations on roles
- `ToolMetadataExtractor` to generate tool metadata from code
- `choragen tools:sync` CLI command
- Web UI for role management and tool viewing
- Migration from hardcoded `allowedRoles` to dynamic role resolution

---

## Why

The current system has hardcoded roles that cannot be customized:
- Only `control` and `impl` roles exist
- Tool permissions are embedded in each `ToolDefinition`
- Users cannot see or modify role-tool relationships
- Adding new roles requires code changes across multiple files

Dynamic roles enable:
- Custom roles tailored to specific workflows (e.g., "researcher", "reviewer")
- Visibility into what tools each role can access
- Flexibility to adjust permissions without code changes
- Better alignment between workflow stages and agent capabilities

---

## Scope

**In Scope**:
- `RoleManager` class with CRUD operations
- Role persistence in `.choragen/roles/index.yaml`
- Tool metadata extraction and caching in `.choragen/tools/index.yaml`
- `choragen tools:sync` CLI command
- Default roles: researcher, implementer, reviewer, controller
- Web API (tRPC routers) for roles and tools
- Web UI: Role list, role editor, tools viewer
- Migration: Remove `allowedRoles` from `ToolDefinition`, update `ToolRegistry`

**Out of Scope**:
- Role inheritance (future enhancement)
- Dynamic tool creation via UI (tools remain code-defined)
- Role versioning/history (may add later)

---

## Affected Design Documents

- docs/design/core/features/role-based-tool-access.md
- docs/design/core/features/workflow-orchestration.md (stage-tool matrix changes)

---

## Linked ADRs

- ADR-010: Agent Runtime Architecture (will be updated)
- ADR-TBD: Role-Based Tool Access Design (to be created)

---

## Commits

No commits yet.

---

## Implementation Notes

### Phase 1: Core Infrastructure
1. Create `Role` and `ToolMetadata` types in `@choragen/core`
2. Implement `RoleManager` with file-based persistence
3. Implement `ToolMetadataExtractor` to scan tool definitions
4. Add `category` and `mutates` fields to `ToolDefinition`
5. Create `choragen tools:sync` command

### Phase 2: Migration
1. Create default roles matching current behavior
2. Update `ToolRegistry` to resolve via `RoleManager`
3. Update `GovernanceGate` to use dynamic roles
4. Remove `allowedRoles` from all tool definitions
5. Deprecate `AgentRole` type

### Phase 3: Web UI
1. Create tRPC routers for roles and tools
2. Build role list page (`/roles`)
3. Build role editor page (`/roles/[id]`)
4. Build tools viewer page (`/tools`)

---

## Completion Notes

All 13 tasks in CHAIN-064 completed:

**Phase 1 - Core Infrastructure**:
- RoleManager with CRUD operations and YAML persistence
- ToolMetadataExtractor for tool metadata generation
- Tool definitions annotated with category/mutates fields
- tools:sync CLI command

**Phase 2 - Runtime Integration**:
- Default roles (researcher, implementer, reviewer, controller)
- ToolRegistry updated with roleId-aware lookup
- GovernanceGate updated with dynamic role validation
- AgentRole deprecated, allowedRoles removed

**Phase 3 - Web UI**:
- tRPC routers for roles and tools
- /roles list page with cards
- /roles/[id] editor with tool selector
- /tools viewer with search, filter, sync
