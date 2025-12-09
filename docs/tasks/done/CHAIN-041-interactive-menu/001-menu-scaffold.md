# Task: Add @clack/prompts and Create Menu Scaffold

**Chain**: CHAIN-041-interactive-menu  
**Task**: 001-menu-scaffold  
**Status**: todo  
**Type**: impl  
**Created**: 2025-12-08

---

## Objective

Add the `@clack/prompts` dependency and create the foundational menu module that will power the interactive agent interface.

---

## Context

The agent runtime (Phases 1-4) is complete with 615 tests. Users currently need to remember CLI flags like `--role`, `--provider`, `--max-tokens`, etc. This task establishes the foundation for a menu-driven interface.

The CR specifies using `@clack/prompts` for its modern aesthetics and good DX. This task creates the menu infrastructure that subsequent tasks will build upon.

---

## Expected Files

- `packages/cli/package.json` (add @clack/prompts dependency)
- `packages/cli/src/menu/index.ts` (module exports)
- `packages/cli/src/menu/types.ts` (menu types and interfaces)
- `packages/cli/src/menu/main-menu.ts` (main menu scaffold)
- `packages/cli/src/__tests__/menu/main-menu.test.ts`

---

## Acceptance Criteria

- [ ] `@clack/prompts` added to `packages/cli/package.json` dependencies
- [ ] Menu module created with proper TypeScript types
- [ ] Main menu function scaffold that displays menu options
- [ ] Menu options defined as constants: Start New Session, Resume Session, List Sessions, Cleanup Sessions, Settings, Exit
- [ ] Unit tests for menu option definitions
- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes

---

## Constraints

- Use `@clack/prompts` as specified in CR (not inquirer or prompts)
- Follow existing CLI code patterns in `packages/cli/src/commands/`
- Menu module should be independent and testable without TTY

---

## Notes

Reference the CR for the menu structure mockup:

```
┌─────────────────────────────────────────┐
│  🤖 Choragen Agent Runtime              │
├─────────────────────────────────────────┤
│                                         │
│  ▸ Start New Session                    │
│    Resume Session (2 paused)            │
│    List Sessions                        │
│    Cleanup Old Sessions                 │
│    Settings                             │
│    Exit                                 │
│                                         │
└─────────────────────────────────────────┘
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
