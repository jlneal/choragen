# Task: Add --role flag to governance:check command

**Chain**: CHAIN-038-cli-role-enforcement  
**Task**: 002-governance-role-check  
**Status**: backlog  
**Type**: impl  
**Created**: 2025-12-08

---

## Objective

Extend the `governance:check` command to support role-based validation using the `--role` flag. This enables checking if a file mutation is allowed for a specific agent role.

---

## Expected Files

Update:
- `packages/cli/src/cli.ts` — Add `--role` flag parsing to `governance:check` command

---

## Acceptance Criteria

- [ ] `choragen governance:check --role impl modify packages/core/src/foo.ts` returns allowed
- [ ] `choragen governance:check --role impl move docs/tasks/todo/x.md` returns denied
- [ ] `choragen governance:check --role control modify packages/core/src/foo.ts` returns denied
- [ ] `choragen governance:check --role control modify docs/tasks/todo/x.md` returns allowed
- [ ] Without `--role`, command uses existing global governance rules (backward compatible)
- [ ] Invalid role value shows helpful error message

---

## Notes

The `checkMutationForRole` function from `@choragen/core` is already implemented. This task wires it up to the CLI.

Updated command signature:
```
governance:check [--role <impl|control>] <action> <file1> [file2...]
```

Example implementation in `governance:check` handler:

```typescript
// Parse --role flag
let role: AgentRole | undefined;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--role" && args[i + 1]) {
    role = args[++i] as AgentRole;
  } else if (args[i].startsWith("--role=")) {
    role = args[i].slice("--role=".length) as AgentRole;
  }
}

// Use role-based check if role specified
if (role) {
  const result = checkMutationForRole(file, action, role, schema);
  // ...
} else {
  // Existing global check
}
```

**Verification**:
```bash
pnpm build
node packages/cli/dist/bin.js governance:check --role impl modify packages/core/src/test.ts
node packages/cli/dist/bin.js governance:check --role impl move docs/tasks/todo/test.md
node packages/cli/dist/bin.js governance:check --role control modify packages/core/src/test.ts
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
