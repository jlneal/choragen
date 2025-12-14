# Task: Implement import graph builder for dependency analysis

**Chain**: CHAIN-079-CR-20251214-002  
**Task**: 003-import-graph  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Implement the import graph builder that parses import statements and builds a dependency graph for cycle detection. This is the core data structure that enables circular import detection.

---

## Expected Files

- `packages/eslint-plugin/src/rules/no-circular-imports.ts (modify)`

---

## File Scope

- `packages/eslint-plugin/src/rules/no-circular-imports.ts`

---

## Acceptance Criteria

- [ ] Parse import statements to extract imported module paths
- [ ] Resolve relative imports to absolute paths within package boundaries
- [ ] Build adjacency list representation of import graph
- [ ] Handle both named imports and default imports
- [ ] Skip external/node_modules imports (respect package boundaries)
- [ ] Cache resolved paths for performance

---

## Notes

**Key considerations**:
- Use ESLint's context to get the current file path
- Resolve relative paths like `./foo` and `../bar` to absolute paths
- Don't follow imports into `node_modules` - only track within-package imports
- Consider using a Map<string, Set<string>> for the graph structure

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
