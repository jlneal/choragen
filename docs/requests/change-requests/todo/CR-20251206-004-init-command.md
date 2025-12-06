# Change Request: Add `choragen init` Command

**ID**: CR-20251206-004  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-06  
**Owner**: Justin  

---

## What

Add a `choragen init` command that scaffolds all required directory structures and files for a new project adopting choragen.

---

## Why

Currently, adopting choragen requires manually creating ~20+ directories and several template files. This is error-prone and creates friction for adoption. A single `init` command makes onboarding trivial.

---

## Scope

**In Scope**:
- `choragen init` CLI command
- Directory structure creation
- Template files (AGENTS.md, governance.yaml, etc.)
- Git hooks installation prompt
- Interactive mode for customization

**Out of Scope**:
- Migration from existing structures
- Integration with other tools

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
│   └── <domain>/
│       ├── personas/
│       ├── scenarios/
│       ├── use-cases/
│       ├── features/
│       └── enhancements/
├── tasks/
│   ├── backlog/
│   ├── todo/
│   ├── in-progress/
│   ├── in-review/
│   ├── done/
│   ├── blocked/
│   └── .chains/
githooks/
├── pre-commit
├── commit-msg
└── AGENTS.md
templates/
└── (task templates, CR/FR templates)
.choragen/
└── config.yaml
AGENTS.md
```

---

## CLI Interface

```bash
# Basic usage
choragen init

# With options
choragen init --domain=myapp --skip-hooks --non-interactive
```

**Interactive prompts**:
1. Project name
2. Primary domain (default: "core")
3. Install git hooks? (Y/n)
4. Create example CR? (y/N)

---

## Acceptance Criteria

- [ ] `choragen init` creates all directories
- [ ] Creates root AGENTS.md with project-specific content
- [ ] Creates .choragen/config.yaml
- [ ] Creates githooks/ with hooks
- [ ] Creates templates/ with CR/FR/task templates
- [ ] Prompts for git hooks installation
- [ ] Works in empty directory
- [ ] Skips existing directories (doesn't overwrite)
- [ ] `--non-interactive` flag for CI/scripts

---

## Linked ADRs

- ADR-001-task-file-format
- ADR-002-governance-schema

---

## Completion Notes

[To be added when moved to done/]
