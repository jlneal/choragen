# Task: Create /chat and /chat/[workflowId] routes with basic layout

**Chain**: CHAIN-061-web-chat-interface  
**Task**: 001-001-chat-routes  
**Status**: in-review  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Create the `/chat` and `/chat/[workflowId]` routes for the web chat interface. These routes provide the main entry points for human interaction with Choragen workflows.

---

## Expected Files

- `packages/web/src/app/chat/page.tsx — Main chat route (shows active workflow or start new)`
- `packages/web/src/app/chat/[workflowId]/page.tsx — Specific workflow conversation`
- `packages/web/src/app/chat/layout.tsx — Shared layout for chat routes`

---

## Acceptance Criteria

- [ ] /chat route renders and shows active workflow or "start new" UI
- [ ] /chat/[workflowId] route renders for a specific workflow
- [ ] Layout includes placeholder areas for: message list, input area, sidebar
- [ ] Routes integrate with existing web app layout (header, navigation)
- [ ] Basic loading and error states handled
- [ ] Unit tests for route components

---

## Notes

Reference design doc: `docs/design/core/features/web-chat-interface.md`

The workflow router is already available at `src/server/routers/workflow.ts` with:
- `workflow.get` — Get workflow by ID
- `workflow.list` — List workflows with filters
- `workflow.create` — Create new workflow

Use existing shadcn/ui components and follow patterns from other routes like `/sessions`.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
