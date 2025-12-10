# Task: Project tRPC Router

**Chain**: CHAIN-057-project-selector  
**Task**: TASK-057-002  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Create a tRPC router for project management that validates directories and updates the server-side context.

---

## Context

The tRPC context currently uses a static `projectRoot` from env vars. This task adds:
1. A `project` router with procedures for validation and switching
2. Context modification to accept project path from client headers
3. Security validation to ensure directories contain `.choragen/` folder

---

## Expected Files

- `packages/web/src/server/routers/project.ts` - New project router
- `packages/web/src/server/context.ts` - Update to read project from headers
- `packages/web/src/server/routers/index.ts` - Register project router

---

## Acceptance Criteria

- [ ] `project.validate` procedure accepts a path and returns `{ valid: boolean, name: string, error?: string }`
- [ ] `project.switch` mutation accepts a path, validates it, and returns success/error
- [ ] Validation checks that path exists and contains `.choragen/` directory
- [ ] Context reads `x-choragen-project-root` header to override default project root (client already sends this)
- [ ] All existing routers continue to work with the dynamic project root

---

## Constraints

- Security: Only allow directories containing `.choragen/` folder
- Must not break existing functionality when no project header is sent
- Follow existing router patterns in `packages/web/src/server/routers/`

---

## Notes

Reference `packages/web/src/server/context.ts` for current context implementation. The header-based approach allows the client to specify which project to use per-request without server restart.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
