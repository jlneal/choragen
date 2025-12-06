# Enhancement: VS Code Extension

**Domain**: core  
**Status**: proposed  
**Priority**: high  
**Created**: 2025-12-06  

---

## Description

A VS Code extension that provides visual task management directly within the IDE. Developers can view, create, and manage task chains without leaving their editor.

---

## Motivation

- **Reduced context switching**: Developers stay in their IDE instead of switching to terminal or browser
- **Visual task board**: Kanban-style view of task states makes progress visible at a glance
- **Quick actions**: One-click task transitions (start, complete, approve)
- **Inline task context**: View task details alongside relevant code files
- **Agent integration**: Seamless handoff between human and AI agents

---

## Proposed Solution

### Core Features

| Feature | Description |
|---------|-------------|
| Task Tree View | Sidebar showing chains and tasks organized by status |
| Task Details Panel | View/edit task markdown with preview |
| Status Bar Integration | Show current active task and chain |
| Quick Commands | Command palette actions for all CLI commands |
| Code Lens | Show linked tasks above relevant code sections |

### Architecture

```
vscode-extension/
├── src/
│   ├── extension.ts        # Extension entry point
│   ├── providers/
│   │   ├── taskTreeProvider.ts
│   │   └── taskDetailsProvider.ts
│   ├── commands/
│   │   ├── chainCommands.ts
│   │   └── taskCommands.ts
│   └── views/
│       └── taskBoard.ts    # Webview for kanban board
├── package.json
└── README.md
```

### Integration Points

- **@choragen/core**: Use existing task chain APIs
- **File System Watcher**: React to task file changes
- **Git Integration**: Show task-related commits

---

## Dependencies

- **@choragen/core**: Must be stable and well-documented
- **Task Chain Management**: Feature must be complete
- **Governance Enforcement**: Feature must be complete

---

## Open Questions

1. **Standalone vs Bundled**: Should the extension bundle @choragen/core or require it as a workspace dependency?
2. **Multi-root Workspaces**: How to handle multiple choragen projects in one workspace?
3. **Remote Development**: How to support VS Code Remote (SSH, Containers, WSL)?
4. **Webview vs TreeView**: Should the kanban board be a webview or native tree view?

---

## Related Documents

- [Task Chain Management](../features/task-chain-management.md)
- [Control Agent Workflow](../scenarios/control-agent-workflow.md)

---

## Acceptance Criteria

- [ ] Extension activates in workspaces with choragen configuration
- [ ] Task tree view shows all chains and tasks
- [ ] Users can transition task status via UI
- [ ] Status bar shows current active task
- [ ] Command palette exposes all CLI commands
