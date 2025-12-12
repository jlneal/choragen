# Feature: Workflow Template Editor

**Domain**: core  
**Status**: draft  
**Created**: 2025-12-11  

---

## Overview

The Workflow Template Editor provides a web UI for viewing and managing workflow templates. Users can create, edit, and delete templates, define stages with gates, and assign roles to each stage. The editor shows which tools will be available at each stage based on the assigned role.

This feature builds on [Role-Based Tool Access](./role-based-tool-access.md) to provide full visibility into the workflow execution context.

---

## Problem

Currently, workflow templates are:

1. **Defined in YAML files** in `.choragen/workflow-templates/` or as built-in defaults
2. **Not editable via UI** — users must manually edit YAML
3. **Opaque about tool availability** — no way to see which tools a stage will have
4. **Disconnected from roles** — stages have a `type` but no explicit role assignment

---

## Solution

A web-based workflow template editor that:

1. Lists all available templates (built-in + custom)
2. Provides CRUD operations for custom templates
3. Allows editing stages: name, type, gate configuration, role assignment
4. Shows tool preview for each stage based on assigned role
5. Supports workflow versioning for audit trail

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Workflow Template Editor                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Template List View                           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │   │
│  │  │ standard │  │ hotfix   │  │ docs     │  │ + New    │        │   │
│  │  │ (builtin)│  │ (builtin)│  │ (builtin)│  │          │        │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   │                                     │
│                                   ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Template Editor View                          │   │
│  │                                                                   │   │
│  │  Name: [standard          ]   Version: 3                         │   │
│  │                                                                   │   │
│  │  Stages:                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────┐ │   │
│  │  │ 1. Request                                                   │ │   │
│  │  │    Type: request    Role: [researcher ▼]                     │ │   │
│  │  │    Gate: human_approval                                      │ │   │
│  │  │    Tools: read_file, list_files, search_files, chain:status  │ │   │
│  │  └─────────────────────────────────────────────────────────────┘ │   │
│  │  ┌─────────────────────────────────────────────────────────────┐ │   │
│  │  │ 2. Design                                                    │ │   │
│  │  │    Type: design     Role: [controller ▼]                     │ │   │
│  │  │    Gate: human_approval                                      │ │   │
│  │  │    Tools: read_file, write_file, chain:new, task:add, ...    │ │   │
│  │  └─────────────────────────────────────────────────────────────┘ │   │
│  │                          ...                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### Enhanced Workflow Template

Extends the existing `WorkflowTemplate` with role assignments and versioning.

```typescript
interface WorkflowTemplate {
  /** Template identifier */
  name: string;
  
  /** Human-readable display name */
  displayName?: string;
  
  /** Template description */
  description?: string;
  
  /** Whether this is a built-in template (read-only) */
  builtin: boolean;
  
  /** Version number (incremented on each save) */
  version: number;
  
  /** Stage definitions */
  stages: WorkflowTemplateStage[];
  
  /** When the template was created */
  createdAt: Date;
  
  /** When the template was last updated */
  updatedAt: Date;
}

interface WorkflowTemplateStage {
  /** Stage name */
  name: string;
  
  /** Stage type (determines default behaviors) */
  type: StageType;
  
  /** Role assigned to this stage */
  roleId: string;
  
  /** Gate configuration */
  gate: StageGateConfig;
  
  /** Transition hooks for automation */
  hooks?: StageTransitionHooks;
  
  /** Optional chain ID for chain_complete gates */
  chainId?: string;
  
  /** Optional session ID */
  sessionId?: string;
}

/** Hooks that run during stage transitions */
interface StageTransitionHooks {
  /** Actions to run when entering this stage */
  onEnter?: TransitionAction[];
  
  /** Actions to run when exiting this stage */
  onExit?: TransitionAction[];
}

/** An action to execute during a stage transition */
interface TransitionAction {
  /** Action type */
  type: "command" | "task_transition" | "file_move" | "custom";
  
  /** For command: shell command to run */
  command?: string;
  
  /** For task_transition: the transition to apply */
  taskTransition?: "start" | "complete" | "approve";
  
  /** For file_move: source and destination patterns */
  fileMove?: { from: string; to: string };
  
  /** For custom: handler name registered in runtime */
  handler?: string;
  
  /** Whether failure blocks the transition (default: true) */
  blocking?: boolean;
}

interface StageGateConfig {
  /** Gate type */
  type: "auto" | "human_approval" | "chain_complete" | "verification_pass";
  
  /** Prompt for human_approval gates */
  prompt?: string;
  
  /** Commands for verification_pass gates */
  commands?: string[];
}
```

### Template Version History

```typescript
interface TemplateVersion {
  /** Template name */
  templateName: string;
  
  /** Version number */
  version: number;
  
  /** Snapshot of the template at this version */
  snapshot: WorkflowTemplate;
  
  /** Who made the change */
  changedBy: string;
  
  /** Change description */
  changeDescription?: string;
  
  /** When this version was created */
  createdAt: Date;
}
```

---

## File Structure

```
.choragen/
├── workflow-templates/
│   ├── standard.yaml       # Custom override of built-in
│   ├── my-custom.yaml      # User-created template
│   └── ...
├── workflow-template-versions/
│   ├── standard/
│   │   ├── v1.yaml
│   │   ├── v2.yaml
│   │   └── v3.yaml
│   └── my-custom/
│       └── v1.yaml
└── ...
```

### Template YAML (Enhanced)

```yaml
name: standard
displayName: Standard Development
description: Full development workflow with design and review stages
version: 3
builtin: false  # false = custom override
createdAt: 2025-12-11T00:00:00Z
updatedAt: 2025-12-11T18:00:00Z

stages:
  - name: request
    type: request
    roleId: researcher
    gate:
      type: human_approval
      prompt: "CR created. Proceed to design?"

  - name: design
    type: design
    roleId: controller
    gate:
      type: human_approval
      prompt: "Design complete. Proceed to implementation?"

  - name: implementation
    type: implementation
    roleId: implementer
    hooks:
      onEnter:
        - type: task_transition
          taskTransition: start
      onExit:
        - type: task_transition
          taskTransition: complete
    gate:
      type: chain_complete

  - name: verification
    type: verification
    roleId: implementer
    gate:
      type: verification_pass
      commands:
        - "pnpm build"
        - "pnpm test"
        - "pnpm lint"

  - name: completion
    type: review
    roleId: reviewer
    gate:
      type: human_approval
      prompt: "All checks pass. Approve and merge?"
```

---

## Web UI

### Routes

| Route | Purpose |
|-------|---------|
| `/workflows` | List all workflow templates |
| `/workflows/new` | Create a new template |
| `/workflows/[name]` | View/edit template |
| `/workflows/[name]/versions` | View version history |
| `/workflows/[name]/versions/[version]` | View specific version |

### Template List Page (`/workflows`)

**Layout:**
- Grid or table of templates
- Each card/row shows: Name, Description, Stage count, Version, Last updated
- Badge for built-in templates
- Actions: View, Edit (if not built-in), Duplicate, Delete (if not built-in)
- "Create Template" button

**Features:**
- Filter by: All, Built-in, Custom
- Search by name/description

### Template Editor (`/workflows/[name]`)

**Header Section:**
- Name field (read-only for built-in)
- Display name field
- Description textarea
- Version badge (read-only)
- Save / Cancel / Delete buttons

**Stages Section:**
- Vertical list of stage cards
- Drag-and-drop reordering
- Each stage card shows:
  - Stage name (editable)
  - Stage type dropdown
  - Role dropdown (shows role name, tool count)
  - Gate type dropdown
  - Gate-specific fields (prompt, commands)
  - Tool preview (collapsible list of tools from assigned role)
  - Delete stage button
- "Add Stage" button at bottom

**Stage Card Expanded View:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Stage 2: Design                                           [×]   │
├─────────────────────────────────────────────────────────────────┤
│ Name:  [design          ]                                       │
│ Type:  [design         ▼]                                       │
│ Role:  [controller     ▼]  (8 tools)                            │
│                                                                 │
│ Gate Type: [human_approval ▼]                                   │
│ Prompt:    [Design complete. Proceed to implementation?    ]    │
│                                                                 │
│ ▼ Tools Available (8)                                           │
│   ├─ Filesystem                                                 │
│   │  • read_file - Read the contents of a file                  │
│   │  • write_file - Write content to a file                     │
│   │  • list_files - List files in a directory                   │
│   ├─ Chain                                                      │
│   │  • chain:new - Create a new task chain                      │
│   │  • chain:status - Get chain status                          │
│   └─ Task                                                       │
│      • task:add - Add a task to a chain                         │
│      • task:status - Get task status                            │
│      • task:list - List tasks in a chain                        │
└─────────────────────────────────────────────────────────────────┘
```

### Version History (`/workflows/[name]/versions`)

- Table of versions: Version #, Changed By, Description, Date
- Click to view read-only snapshot
- "Restore" button to revert to a previous version

---

## API (tRPC)

### Workflow Template Router

```typescript
const workflowTemplateRouter = router({
  // List all templates (built-in + custom)
  list: publicProcedure.query(async () => {
    return templateManager.list();
  }),

  // Get single template
  get: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input }) => {
      return templateManager.get(input.name);
    }),

  // Create template
  create: publicProcedure
    .input(createTemplateSchema)
    .mutation(async ({ input }) => {
      return templateManager.create(input);
    }),

  // Update template (creates new version)
  update: publicProcedure
    .input(updateTemplateSchema)
    .mutation(async ({ input }) => {
      return templateManager.update(input.name, input, {
        changedBy: input.changedBy,
        changeDescription: input.changeDescription,
      });
    }),

  // Delete template (custom only)
  delete: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input }) => {
      return templateManager.delete(input.name);
    }),

  // Duplicate template
  duplicate: publicProcedure
    .input(z.object({ 
      sourceName: z.string(), 
      newName: z.string() 
    }))
    .mutation(async ({ input }) => {
      return templateManager.duplicate(input.sourceName, input.newName);
    }),

  // List versions
  listVersions: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input }) => {
      return templateManager.listVersions(input.name);
    }),

  // Get specific version
  getVersion: publicProcedure
    .input(z.object({ name: z.string(), version: z.number() }))
    .query(async ({ input }) => {
      return templateManager.getVersion(input.name, input.version);
    }),

  // Restore to previous version
  restoreVersion: publicProcedure
    .input(z.object({ 
      name: z.string(), 
      version: z.number(),
      changedBy: z.string(),
    }))
    .mutation(async ({ input }) => {
      return templateManager.restoreVersion(
        input.name, 
        input.version,
        input.changedBy
      );
    }),
});
```

---

## Integration with Role-Based Tool Access

When a user selects a role for a stage, the UI:

1. Fetches the role's `toolIds` from the Role API
2. Fetches tool metadata for those IDs from the Tool API
3. Groups tools by category
4. Displays the tool list in the stage card

This provides immediate feedback about what capabilities the agent will have at that stage.

---

## Built-in Template Handling

Built-in templates (`standard`, `hotfix`, `documentation`) are:

1. **Always available** — cannot be deleted
2. **Read-only by default** — editing creates a custom override
3. **Restorable** — user can delete custom override to restore built-in

When a user edits a built-in template:
- System creates a copy in `.choragen/workflow-templates/`
- The copy shadows the built-in
- Deleting the copy restores the built-in behavior

---

## Acceptance Criteria

- [ ] Template list page shows all templates (built-in + custom)
- [ ] Built-in templates are marked and protected from deletion
- [ ] Users can create new custom templates
- [ ] Users can edit custom templates (or create overrides of built-in)
- [ ] Stage editor supports: name, type, role, gate configuration
- [ ] Role dropdown shows available roles with tool counts
- [ ] Tool preview shows tools available for selected role
- [ ] Stages can be reordered via drag-and-drop
- [ ] Stages can be added and removed
- [ ] Template saves create new versions
- [ ] Version history is viewable
- [ ] Previous versions can be restored
- [ ] Deleting a built-in override restores the built-in

---

## Linked Scenarios

- [Human-Driven Development](../scenarios/human-driven-development.md)

---

## Linked Features

- [Role-Based Tool Access](./role-based-tool-access.md)
- [Workflow Orchestration](./workflow-orchestration.md)

---

## Linked ADRs

- ADR-011: Workflow Orchestration Design
- ADR-TBD: Role-Based Tool Access Design

---

## Open Questions

1. **Template validation**: Should we validate that all referenced roles exist before saving?
2. **Stage type constraints**: Should certain stage types require certain gate types?
3. **Template inheritance**: Should templates be able to extend other templates?
4. **Import/Export**: Should users be able to export templates as YAML for sharing?
5. **Active workflow impact**: What happens to running workflows when their template changes?
