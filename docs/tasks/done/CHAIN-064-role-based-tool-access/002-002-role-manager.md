# Task: Implement RoleManager with file-based persistence

**Chain**: CHAIN-064-role-based-tool-access  
**Task**: 002-002-role-manager  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Implement `RoleManager` class in `@choragen/core` that provides CRUD operations for roles with file-based persistence in `.choragen/roles/index.yaml`.

---

## Expected Files

- `packages/core/src/roles/role-manager.ts - RoleManager class`
- `packages/core/src/roles/index.ts - Update to export RoleManager`
- `packages/core/src/__tests__/roles/role-manager.test.ts - Unit tests`

---

## Acceptance Criteria

- [ ] RoleManager class with constructor taking projectRoot: string
- [ ] list(): Promise<Role[]> - Returns all roles
- [ ] get(id: string): Promise<Role | null> - Returns role by ID or null
- [ ] create(input: CreateRoleInput): Promise<Role> - Creates new role
- [ ] - CreateRoleInput: { name: string, description?: string, toolIds: string[] }
- [ ] - Auto-generates id from slugified name
- [ ] - Sets createdAt and updatedAt to current time
- [ ] - Throws if role with same ID exists
- [ ] update(id: string, input: UpdateRoleInput): Promise<Role> - Updates role
- [ ] - UpdateRoleInput: { name?: string, description?: string, toolIds?: string[] }
- [ ] - Updates updatedAt timestamp
- [ ] - Throws if role not found
- [ ] delete(id: string): Promise<void> - Deletes role
- [ ] - Throws if role not found
- [ ] ensureDefaults(): Promise<void> - Creates default roles if none exist
- [ ] File persistence:
- [ ] - Reads from .choragen/roles/index.yaml
- [ ] - Writes to .choragen/roles/index.yaml
- [ ] - Creates directory if it doesn't exist
- [ ] YAML format matches design doc example
- [ ] Unit tests cover all CRUD operations
- [ ] pnpm build passes
- [ ] pnpm --filter @choragen/core test passes
- [ ] pnpm lint passes

---

## Constraints

- Use simple YAML parsing (similar to packages/core/src/workflow/templates.ts)
- Do NOT use external YAML libraries unless already in dependencies
- Follow existing patterns in packages/core/src/ for file I/O

---

## Notes

Reference the design doc for YAML format:
```yaml
roles:
  - id: researcher
    name: Researcher
    description: Read-only access for exploration
    toolIds:
      - read_file
      - list_files
    createdAt: 2025-12-11T00:00:00Z
    updatedAt: 2025-12-11T00:00:00Z
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
