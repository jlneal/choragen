# Task: Project Context Provider

**Chain**: CHAIN-057-project-selector  
**Task**: TASK-057-001  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Create a React context provider and hook for managing the selected project directory, with localStorage persistence for recent projects.

---

## Context

The web dashboard currently uses `process.env.CHORAGEN_PROJECT_ROOT || process.cwd()` to determine the project root. This task creates the client-side state management infrastructure to support dynamic project switching.

The context will:
- Store the currently selected project path
- Maintain a list of recent projects (max 5-10)
- Persist recent projects to localStorage
- Provide methods to select a project and clear history

---

## Expected Files

- `packages/web/src/hooks/use-project.tsx` - Context provider and hook
- `packages/web/src/lib/project-storage.ts` - localStorage utilities for recent projects

---

## Acceptance Criteria

- [ ] `ProjectProvider` context wraps the app (add to layout)
- [ ] `useProject()` hook returns `{ projectPath, recentProjects, selectProject, clearHistory }`
- [ ] Recent projects persist across browser sessions via localStorage
- [ ] Maximum of 5 recent projects stored (oldest removed when limit exceeded)
- [ ] Selected project is passed to tRPC client via custom headers

---

## Constraints

- Must be a client component ("use client")
- Follow existing patterns in `packages/web/src/hooks/`
- Use shadcn/ui patterns for any UI elements

---

## Notes

The tRPC integration will be completed in TASK-057-002. For now, focus on the React context and localStorage persistence. The `selectProject` function should update state and call a tRPC mutation (to be added in next task).

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
