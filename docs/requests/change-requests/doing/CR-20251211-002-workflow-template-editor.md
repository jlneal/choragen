# Change Request: Workflow Template Editor

**ID**: CR-20251211-002  
**Domain**: core  
**Status**: doing  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Build a web UI for viewing and managing workflow templates. Users can create, edit, and delete templates, define stages with gates, and assign roles to each stage. The editor shows which tools will be available at each stage based on the assigned role.

Key deliverables:
- Enhanced `WorkflowTemplate` type with role assignments and versioning
- `TemplateManager` in `@choragen/core` for CRUD + versioning
- Web UI for template list, editor, and version history
- Integration with Role-Based Tool Access for tool preview

---

## Why

Currently, workflow templates are:
- Defined only in YAML files, not editable via UI
- Opaque about tool availability at each stage
- Disconnected from roles (stages have `type` but no explicit role)
- Not versioned, making it hard to track changes

A template editor enables:
- Visual workflow design without editing YAML
- Clear visibility into what tools each stage provides
- Role assignment per stage for fine-grained control
- Version history for audit and rollback

---

## Scope

**In Scope**:
- Enhanced `WorkflowTemplate` with `roleId` per stage and `version` field
- **Stage transition hooks** (`onEnter`/`onExit` actions for automation)
- `TemplateManager` class with CRUD + versioning
- `TransitionHookRunner` for executing hooks during stage transitions
- Template persistence with version history in `.choragen/workflow-template-versions/`
- Web API (tRPC router) for templates
- Web UI: Template list, template editor, version history
- Stage editor with role dropdown, tool preview, and hook configuration
- Drag-and-drop stage reordering
- Built-in template handling (read-only, can create override)

**Out of Scope**:
- Template inheritance
- Import/export functionality
- Parallel stage execution
- Stage rollback during workflow execution

---

## Affected Design Documents

- docs/design/core/features/workflow-template-editor.md
- docs/design/core/features/workflow-orchestration.md (template schema changes)
- docs/design/core/features/role-based-tool-access.md (integration)

---

## Linked ADRs

- ADR-011: Workflow Orchestration Design (will be updated)
- ADR-TBD: Role-Based Tool Access Design

---

## Commits

No commits yet.

---

## Implementation Notes

### Dependencies
- **Requires CR-20251211-001** (Role-Based Tool Access) to be completed first
- Role dropdown and tool preview depend on role/tool APIs

### Phase 1: Core Infrastructure
1. Extend `WorkflowTemplate` type with `roleId`, `version`, `displayName`, `description`
2. Add `StageTransitionHooks` and `TransitionAction` types
3. Implement `TemplateManager` with CRUD operations
4. Implement `TransitionHookRunner` for executing hooks during stage transitions
5. Implement version history storage and retrieval
6. Update existing template loading to support new fields

### Phase 2: Web API
1. Create tRPC router for workflow templates
2. Endpoints: list, get, create, update, delete, duplicate
3. Version endpoints: listVersions, getVersion, restoreVersion

### Phase 3: Web UI
1. Build template list page (`/workflows`)
2. Build template editor page (`/workflows/[name]`)
3. Build stage editor component with role/gate configuration
4. Integrate tool preview from Role-Based Tool Access
5. Build version history page (`/workflows/[name]/versions`)
6. Add drag-and-drop stage reordering

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
