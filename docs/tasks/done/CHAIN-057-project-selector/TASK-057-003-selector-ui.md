# Task: Project Selector UI Component

**Chain**: CHAIN-057-project-selector  
**Task**: TASK-057-003  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Create the project selector dropdown component with recent projects list and directory browser capability.

---

## Context

This is the main UI component for project switching. It should display:
- Current project name (derived from directory name)
- Dropdown with recent projects
- "Browse..." option to select a new directory
- Visual indicator of active project

The component will use the `useProject()` hook from TASK-057-001 and call the tRPC procedures from TASK-057-002.

---

## Expected Files

- `packages/web/src/components/project/project-selector.tsx` - Main dropdown component
- `packages/web/src/components/project/project-browser.tsx` - Directory browser dialog (optional, may use native input)
- `packages/web/src/components/project/index.ts` - Barrel export

---

## Acceptance Criteria

- [ ] Dropdown shows current project name with folder icon
- [ ] Recent projects list shows up to 5 projects with their names
- [ ] Clicking a recent project switches to it (calls `selectProject`)
- [ ] "Browse..." option opens a text input dialog for entering a path
- [ ] Invalid paths show error toast via sonner
- [ ] Loading state shown while validating/switching projects
- [ ] Component follows shadcn/ui patterns (use DropdownMenu or Popover)

---

## Constraints

- Must be a client component ("use client")
- Use existing shadcn/ui components (DropdownMenu, Dialog, Button, Input)
- Use Lucide icons (FolderOpen, ChevronDown, Check, etc.)
- Follow existing component patterns in `packages/web/src/components/`

---

## Notes

For the directory browser, a simple text input dialog is acceptable for v1. Native file system access API could be added later but has browser compatibility concerns.

UI mockup from CR:
```
┌───────────────┐
│ Recent:       │
│ • choragen    │
│ • my-project  │
│ ─────────────│
│ Browse...     │
└───────────────┘
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
