# Task: Create Role and ToolMetadata types in @choragen/core

**Chain**: CHAIN-064-role-based-tool-access  
**Task**: 001-001-role-tool-types  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Create the foundational type definitions for the Role-Based Tool Access feature in `@choragen/core`. These types will be used by `RoleManager`, `ToolMetadataExtractor`, and the web UI.

---

## Expected Files

- `packages/core/src/roles/types.ts - Role, ToolMetadata, ToolCategory interfaces`
- `packages/core/src/roles/index.ts - Re-exports`
- `packages/core/src/index.ts - Update to export roles module`
- `packages/core/src/__tests__/roles/types.test.ts - Type validation tests`

---

## Acceptance Criteria

- [ ] Role interface matches design doc spec:
- [ ] - id: string - Unique role identifier
- [ ] - name: string - Human-readable name
- [ ] - description?: string - Optional description
- [ ] - toolIds: string[] - Tool IDs this role can use
- [ ] - createdAt: Date - Creation timestamp
- [ ] - updatedAt: Date - Last update timestamp
- [ ] ToolMetadata interface matches design doc spec:
- [ ] - id: string - Tool identifier
- [ ] - name: string - Human-readable name
- [ ] - description: string - Tool description
- [ ] - category: string - Category for UI grouping
- [ ] - parameters: ToolParameterSchema - JSON Schema for parameters
- [ ] - mutates: boolean - Whether tool can modify state
- [ ] ToolCategory interface defined:
- [ ] - id: string - Category identifier
- [ ] - name: string - Display name
- [ ] - description?: string - Optional description
- [ ] - order: number - Display order
- [ ] Default categories constant exported:
- [ ] - filesystem, search, chain, task, session, command
- [ ] Types are exported from @choragen/core
- [ ] Unit tests validate type structure
- [ ] pnpm build passes
- [ ] pnpm --filter @choragen/core test passes
- [ ] pnpm lint passes

---

## Constraints

- Do NOT modify packages/cli/src/runtime/tools/types.ts yet (that's Task 004)
- Do NOT create the RoleManager class yet (that's Task 002)
- Keep types minimal - only what's specified in the design doc
- Follow existing patterns in packages/core/src/ for file organization

---

## Notes

Reference the design doc section "Core Concepts" for exact interface definitions:
`docs/design/core/features/role-based-tool-access.md#core-concepts`

The `ToolParameterSchema` type already exists in `packages/cli/src/runtime/providers/types.ts`. For now, define a compatible type locally or import from a shared location.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
