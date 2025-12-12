# Feature: Role-Based Tool Access

**Domain**: core  
**Status**: draft  
**Created**: 2025-12-11  

---

## Overview

Role-Based Tool Access introduces **dynamic roles** as first-class entities that define which tools an agent can use. This replaces the current hardcoded `AgentRole` enum (`"control" | "impl"`) with a flexible, user-configurable system.

Roles are assigned to workflow stages, allowing users to see exactly which tools will be available at each step of a workflow.

---

## Problem

The current system has several limitations:

1. **Hardcoded roles**: Only `control` and `impl` roles exist, defined as a TypeScript enum
2. **Embedded tool permissions**: Each `ToolDefinition` contains an `allowedRoles` array, coupling tools to roles in code
3. **No UI visibility**: Users cannot see or modify which tools are available to which roles
4. **Limited flexibility**: Adding a new role requires code changes across multiple files

---

## Solution

Make roles first-class, configurable entities:

1. **Roles** are defined in `.choragen/roles/index.yaml`
2. **Tools** remain code-defined but export metadata to `.choragen/tools/index.yaml`
3. **Role → Tool assignments** are stored in the role definition
4. **Workflow stages** reference roles by ID
5. **Web UI** provides CRUD for roles and read-only view of tools

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Role-Based Tool Access                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │
│  │     Roles       │     │     Tools       │     │   Workflow      │   │
│  │  (configurable) │────▶│  (code-defined) │◀────│   Templates     │   │
│  │                 │     │                 │     │                 │   │
│  │  .choragen/     │     │  .choragen/     │     │  .choragen/     │   │
│  │  roles/         │     │  tools/         │     │  workflow-      │   │
│  │  index.yaml     │     │  index.yaml     │     │  templates/     │   │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘   │
│           │                      ▲                       │              │
│           │                      │                       │              │
│           ▼                      │                       ▼              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        Runtime Resolution                        │   │
│  │                                                                   │   │
│  │  WorkflowStage.roleId → Role.toolIds → Tool definitions          │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### Role

A role defines a set of capabilities (tools) that an agent can use.

```typescript
interface Role {
  /** Unique role identifier (e.g., "researcher", "implementer") */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Description of the role's purpose */
  description?: string;
  
  /** Tool IDs this role can use */
  toolIds: string[];
  
  /** When the role was created */
  createdAt: Date;
  
  /** When the role was last updated */
  updatedAt: Date;
}
```

### Tool (Metadata)

Tool metadata extracted from code for UI display and role assignment.

```typescript
interface ToolMetadata {
  /** Tool identifier (e.g., "read_file", "chain:status") */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Description of what the tool does */
  description: string;
  
  /** Category for UI grouping */
  category: string;
  
  /** JSON Schema for parameters */
  parameters: ToolParameterSchema;
  
  /** Whether this tool can modify state (for UI hints) */
  mutates: boolean;
}
```

### Tool Category

Categories group tools in the UI for easier browsing.

```typescript
interface ToolCategory {
  /** Category identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Display order */
  order: number;
}
```

### Default Categories

| Category | Description | Example Tools |
|----------|-------------|---------------|
| `filesystem` | File operations | `read_file`, `write_file`, `list_files` |
| `search` | Search operations | `search_files` |
| `chain` | Chain management | `chain:status`, `chain:new` |
| `task` | Task management | `task:start`, `task:complete`, `task:approve` |
| `session` | Session management | `spawn_impl_session` |
| `command` | Shell commands | `run_command` |

---

## File Structure

```
.choragen/
├── roles/
│   └── index.yaml          # Role definitions
├── tools/
│   ├── index.yaml          # Tool metadata (generated from code)
│   └── categories.yaml     # Tool category definitions
└── workflow-templates/
    └── *.yaml              # Templates reference roles by ID
```

### roles/index.yaml

```yaml
roles:
  - id: researcher
    name: Researcher
    description: Read-only access for exploration and analysis
    toolIds:
      - read_file
      - list_files
      - search_files
      - chain:status
      - task:status
      - task:list
    createdAt: 2025-12-11T00:00:00Z
    updatedAt: 2025-12-11T00:00:00Z

  - id: implementer
    name: Implementer
    description: Full implementation capabilities
    toolIds:
      - read_file
      - write_file
      - list_files
      - search_files
      - chain:status
      - task:start
      - task:complete
      - task:status
      - task:list
      - run_command
    createdAt: 2025-12-11T00:00:00Z
    updatedAt: 2025-12-11T00:00:00Z

  - id: reviewer
    name: Reviewer
    description: Review and approval capabilities
    toolIds:
      - read_file
      - list_files
      - search_files
      - chain:status
      - task:approve
      - task:status
      - task:list
    createdAt: 2025-12-11T00:00:00Z
    updatedAt: 2025-12-11T00:00:00Z

  - id: controller
    name: Controller
    description: Orchestration and coordination
    toolIds:
      - read_file
      - list_files
      - search_files
      - chain:status
      - chain:new
      - task:add
      - task:status
      - task:list
      - spawn_impl_session
    createdAt: 2025-12-11T00:00:00Z
    updatedAt: 2025-12-11T00:00:00Z
```

### tools/index.yaml (Generated)

```yaml
# AUTO-GENERATED by `choragen tools:sync`
# Do not edit manually - changes will be overwritten

generatedAt: 2025-12-11T00:00:00Z
sourceHash: abc123...

tools:
  - id: read_file
    name: Read File
    description: Read the contents of a file
    category: filesystem
    mutates: false
    parameters:
      type: object
      properties:
        path:
          type: string
          description: Path to file (relative to project root)
      required: [path]

  - id: write_file
    name: Write File
    description: Write content to a file
    category: filesystem
    mutates: true
    parameters:
      type: object
      properties:
        path:
          type: string
        content:
          type: string
        createOnly:
          type: boolean
      required: [path, content]
  
  # ... more tools
```

---

## Migration from Hardcoded Roles

### Current State

```typescript
// packages/cli/src/runtime/tools/types.ts
export type AgentRole = "control" | "impl";

// packages/cli/src/runtime/tools/definitions/write-file.ts
export const writeFileTool: ToolDefinition = {
  name: "write_file",
  allowedRoles: ["impl"],  // Hardcoded
  // ...
};
```

### Target State

```typescript
// packages/core/src/roles/types.ts
export interface Role {
  id: string;
  name: string;
  description?: string;
  toolIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// packages/cli/src/runtime/tools/definitions/write-file.ts
export const writeFileTool: ToolDefinition = {
  name: "write_file",
  category: "filesystem",
  mutates: true,
  // No allowedRoles - determined by Role.toolIds
  // ...
};
```

### Migration Steps

1. Create `RoleManager` in `@choragen/core` for CRUD operations
2. Create `ToolMetadataExtractor` to generate `tools/index.yaml` from code
3. Add `choragen tools:sync` CLI command
4. Update `ToolRegistry` to resolve permissions via `RoleManager`
5. Update `GovernanceGate` to use dynamic role resolution
6. Create default roles that match current `control`/`impl` behavior
7. Remove `allowedRoles` from `ToolDefinition` interface
8. Update all tool definitions to include `category` and `mutates`

---

## Web UI

### Routes

| Route | Purpose |
|-------|---------|
| `/roles` | List all roles with tool counts |
| `/roles/new` | Create a new role |
| `/roles/[id]` | View/edit role, assign tools |
| `/tools` | View all tools grouped by category |

### Role List Page (`/roles`)

- Table with columns: Name, Description, Tool Count, Actions
- Actions: Edit, Delete (with confirmation)
- "Create Role" button

### Role Editor (`/roles/[id]`)

- Form fields: Name, Description
- Tool assignment: Multi-select grouped by category
- Preview: List of assigned tools with descriptions
- Save/Cancel buttons

### Tools Page (`/tools`)

- Read-only view of all available tools
- Grouped by category (collapsible sections)
- Each tool shows: Name, Description, Parameters, Mutates badge
- Search/filter functionality

---

## API (tRPC)

### Role Router

```typescript
const roleRouter = router({
  // List all roles
  list: publicProcedure.query(async () => {
    return roleManager.list();
  }),

  // Get single role
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return roleManager.get(input.id);
    }),

  // Create role
  create: publicProcedure
    .input(createRoleSchema)
    .mutation(async ({ input }) => {
      return roleManager.create(input);
    }),

  // Update role
  update: publicProcedure
    .input(updateRoleSchema)
    .mutation(async ({ input }) => {
      return roleManager.update(input.id, input);
    }),

  // Delete role
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return roleManager.delete(input.id);
    }),
});
```

### Tool Router

```typescript
const toolRouter = router({
  // List all tools with metadata
  list: publicProcedure.query(async () => {
    return toolMetadataManager.list();
  }),

  // List tool categories
  categories: publicProcedure.query(async () => {
    return toolMetadataManager.listCategories();
  }),

  // Sync tools from code (admin action)
  sync: publicProcedure.mutation(async () => {
    return toolMetadataManager.syncFromCode();
  }),
});
```

---

## Acceptance Criteria

- [ ] Roles are stored in `.choragen/roles/index.yaml`
- [ ] Tool metadata is generated to `.choragen/tools/index.yaml`
- [ ] `choragen tools:sync` CLI command extracts tool metadata from code
- [ ] `RoleManager` provides CRUD operations for roles
- [ ] `ToolRegistry` resolves tool access via roles (not hardcoded `allowedRoles`)
- [ ] Default roles created on first run: researcher, implementer, reviewer, controller
- [ ] Web UI: Role list page with CRUD actions
- [ ] Web UI: Role editor with tool assignment
- [ ] Web UI: Tools page with category grouping
- [ ] Workflow templates can reference roles by ID
- [ ] Runtime enforces tool access based on role assignment

---

## Linked Scenarios

- [Human-Driven Development](../scenarios/human-driven-development.md)
- [Agent Runtime Orchestration](../scenarios/agent-runtime-orchestration.md)

---

## Linked Features

- [Workflow Orchestration](./workflow-orchestration.md)
- [Workflow Template Editor](./workflow-template-editor.md) (to be created)

---

## Linked ADRs

- ADR-010: Agent Runtime Architecture
- ADR-TBD: Role-Based Tool Access Design

---

## Open Questions

1. **Role deletion**: What happens to workflow templates referencing a deleted role?
2. **Tool sync conflicts**: How to handle tools removed from code but still referenced by roles?
3. **Role versioning**: Should role changes be versioned for audit?
4. **Inheritance**: Future enhancement - should roles be able to extend other roles?
