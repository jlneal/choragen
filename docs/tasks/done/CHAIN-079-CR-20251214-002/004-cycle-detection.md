# Task: Implement cycle detection algorithm with configurable depth

**Chain**: CHAIN-079-CR-20251214-002  
**Task**: 004-cycle-detection  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Implement the cycle detection algorithm that traverses the import graph to find circular dependencies. Must support configurable depth limit.

---

## Expected Files

- `packages/eslint-plugin/src/rules/no-circular-imports.ts (modify)`

---

## File Scope

- `packages/eslint-plugin/src/rules/no-circular-imports.ts`

---

## Acceptance Criteria

- [ ] Detect direct circular imports (A → B → A)
- [ ] Detect transitive circular imports (A → B → C → A)
- [ ] Respect maxDepth option (default: 5) to limit search depth
- [ ] Return the full cycle path for error reporting
- [ ] Use DFS with visited set to avoid infinite loops
- [ ] Performance: avoid re-traversing already-checked paths

---

## Notes

**Algorithm**: Depth-first search with path tracking
```
function findCycle(start, current, path, visited, depth):
  if depth > maxDepth: return null
  if current in path: return path.slice(path.indexOf(current))
  if current in visited: return null
  
  visited.add(current)
  path.push(current)
  
  for each import of current:
    cycle = findCycle(start, import, path, visited, depth + 1)
    if cycle: return cycle
  
  path.pop()
  return null
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
