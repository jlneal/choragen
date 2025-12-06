# Task: Implement directory scaffolding

**Chain**: CHAIN-011-init-command  
**Task**: 001-directory-scaffolding  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Create the core directory scaffolding logic for `choragen init` that creates all required directories.

---

## Expected Files

Create:
- `packages/cli/src/commands/init.ts` - The init command implementation

Update:
- `packages/cli/src/cli.ts` - Register the init command

---

## Acceptance Criteria

- [ ] `choragen init` creates docs/ structure (requests, adr, design, tasks)
- [ ] Creates githooks/ directory
- [ ] Creates templates/ directory  
- [ ] Creates .choragen/ directory
- [ ] Skips existing directories (doesn't overwrite)
- [ ] Reports what was created

---

## Directory Structure to Create

```
docs/
├── requests/
│   ├── change-requests/
│   │   ├── todo/
│   │   ├── doing/
│   │   └── done/
│   └── fix-requests/
│       ├── todo/
│       ├── doing/
│       └── done/
├── adr/
│   ├── todo/
│   ├── doing/
│   ├── done/
│   └── archive/
├── design/
│   └── core/
│       ├── personas/
│       ├── scenarios/
│       ├── use-cases/
│       ├── features/
│       └── enhancements/
├── tasks/
│   ├── .chains/
│   ├── backlog/
│   ├── todo/
│   ├── in-progress/
│   ├── in-review/
│   ├── done/
│   └── blocked/
githooks/
templates/
.choragen/
```

---

## Notes

Reference existing CLI structure in `packages/cli/src/`.

**Verification**:
```bash
pnpm build
# Test in a temp directory
```
