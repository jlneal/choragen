# Use Case: Bootstrap New Project

**Domain**: core  
**Created**: 2025-12-06  

---

## User Goal

As a developer starting a new project, I want to initialize choragen so that I can use structured task chains and governance for coordinated development.

---

## Actor

- **Primary**: [Solo Developer](../personas/solo-developer.md), [Team Lead](../personas/team-lead.md), [Open Source Maintainer](../personas/open-source-maintainer.md)
- **Secondary**: [AI Agent](../personas/ai-agent.md) (may assist with setup)

---

## Preconditions

- User has an existing Git repository (or will create one)
- Node.js and pnpm/npm are installed
- User has decided to adopt choragen for project coordination

---

## Main Flow

1. **Install choragen CLI**
   ```bash
   pnpm add -D @choragen/cli
   # or globally: pnpm add -g @choragen/cli
   ```

2. **Initialize choragen in the project**
   ```bash
   choragen init
   ```

3. **CLI creates directory structure**
   ```
   .choragen/
   └── config.yaml
   
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
   └── tasks/
       ├── .chains/
       ├── backlog/
       ├── todo/
       ├── in-progress/
       ├── in-review/
       ├── done/
       └── blocked/
   ```

4. **CLI creates governance file**
   ```yaml
   # choragen.governance.yaml
   version: "1.0"
   domains:
     core:
       paths:
         - "src/**"
         - "packages/**"
   ```

5. **CLI creates AGENTS.md**
   - Root-level AGENTS.md with project guidelines
   - Instructions for AI agents working on the project

6. **User reviews generated files**
   - Customize governance rules for their project
   - Update AGENTS.md with project-specific conventions

7. **Commit initial setup**
   ```bash
   git add .
   git commit -m "chore: initialize choragen"
   ```

---

## Alternative Flows

### A1: Existing docs/ directory

If `docs/` already exists:
1. CLI prompts for confirmation before modifying
2. CLI merges choragen structure with existing content
3. CLI warns about any conflicts

### A2: Custom configuration

User wants non-default settings:
1. Run `choragen init --interactive`
2. CLI prompts for:
   - Domains to create (default: core)
   - Governance strictness level
   - Whether to create example documents
3. CLI generates customized structure

### A3: Monorepo setup

For monorepos with multiple packages:
1. Run `choragen init` at repo root
2. CLI detects monorepo structure
3. CLI creates domain per package
4. Governance rules scope to package paths

---

## Postconditions

- `.choragen/config.yaml` exists with valid configuration
- `choragen.governance.yaml` exists with domain rules
- `docs/` directory structure is created
- `AGENTS.md` exists with project guidelines
- User can run `choragen chain:new` to start work

---

## Error Conditions

| Error | Cause | Resolution |
|-------|-------|------------|
| "Not a git repository" | Running outside git repo | Initialize git first |
| "Config already exists" | Re-running init | Use `--force` to overwrite |
| "Permission denied" | File system permissions | Check directory permissions |

---

## Related Features

- [Task Chain Management](../features/task-chain-management.md)
- [Governance Enforcement](../features/governance-enforcement.md)

---

## Acceptance Criteria

- [ ] `choragen init` creates `.choragen/config.yaml`
- [ ] `choragen init` creates `choragen.governance.yaml`
- [ ] `choragen init` creates `docs/` directory structure
- [ ] `choragen init` creates root `AGENTS.md`
- [ ] User can run `choragen chain:new` after initialization

---

## Related Scenarios

- [Control Agent Workflow](../scenarios/control-agent-workflow.md)
