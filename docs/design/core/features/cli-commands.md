# Feature: CLI Commands

**Domain**: core  
**Created**: 2025-12-07  
**Status**: Implemented  

---

## Overview

The `choragen` CLI provides commands for managing task chains, governance policies, file locks, and project initialization. It serves as the primary interface for both human developers and AI agents.

---

## Command Structure

Commands follow a `namespace:action` pattern:

```bash
choragen <namespace>:<action> [arguments] [options]
```

Namespaces:
- `chain` - Chain lifecycle management
- `task` - Task lifecycle management
- `governance` - Policy enforcement
- `lock` - File locking
- `cr` / `fr` / `adr` / `design` - Document creation
- `validate` - Validation scripts

---

## Chain Lifecycle Commands

### chain:new

Create a new task chain from a CR/FR:

```bash
choragen chain:new <request-id> <slug> [title] [options]
```

Options:
- `--type=design|implementation` - Chain type
- `--depends-on=CHAIN-xxx` - Dependency on another chain

### chain:new:design

Shorthand for creating a design chain:

```bash
choragen chain:new:design <request-id> <slug> [title]
```

### chain:new:impl

Shorthand for creating an implementation chain:

```bash
choragen chain:new:impl <request-id> <slug> [title] [options]
```

Options:
- `--depends-on=CHAIN-xxx` - Link to design chain (required unless --skip-design)
- `--skip-design="justification"` - Skip design chain requirement

### chain:status

Show chain status and progress:

```bash
choragen chain:status [chain-id]
```

Without chain-id, shows all chains.

### chain:list

List all chains with their status:

```bash
choragen chain:list
```

---

## Task Lifecycle Commands

### task:add

Add a task to a chain:

```bash
choragen task:add <chain-id> <slug> <title>
```

Creates task in backlog status.

### task:ready

Move task from backlog to todo:

```bash
choragen task:ready <chain-id> <task-id>
```

### task:start

Start working on a task (move to in-progress):

```bash
choragen task:start <chain-id> <task-id>
```

### task:complete

Mark task as complete (move to in-review):

```bash
choragen task:complete <chain-id> <task-id>
```

### task:approve

Approve a completed task (move to done):

```bash
choragen task:approve <chain-id> <task-id>
```

### task:rework

Send task back for rework:

```bash
choragen task:rework <chain-id> <task-id>
```

### task:block

Mark task as blocked:

```bash
choragen task:block <chain-id> <task-id>
```

### task:next

Show next available task for a chain:

```bash
choragen task:next <chain-id>
```

### task:list

List all tasks in a chain:

```bash
choragen task:list <chain-id>
```

---

## Governance Commands

### governance:check

Check files against governance rules:

```bash
choragen governance:check <action> <file1> [file2...]
```

Actions: `create`, `modify`, `delete`

Returns:
- Exit 0: All files allowed
- Exit 1: Some files denied

---

## Lock Commands

### lock:acquire

Acquire locks for a chain:

```bash
choragen lock:acquire <chain-id> <pattern1> [pattern2...]
```

### lock:release

Release locks for a chain:

```bash
choragen lock:release <chain-id>
```

### lock:status

Show current lock status:

```bash
choragen lock:status
```

---

## Document Creation Commands

### cr:new

Create a new Change Request:

```bash
choragen cr:new <slug> [title] [--domain=<domain>]
```

### cr:close

Close a Change Request:

```bash
choragen cr:close <cr-id>
```

### fr:new

Create a new Fix Request:

```bash
choragen fr:new <slug> [title] [--domain=<domain>] [--severity=<severity>]
```

### adr:new

Create a new Architecture Decision Record:

```bash
choragen adr:new <slug> [title] [--request=<cr-id>]
```

### design:new

Create a new design document:

```bash
choragen design:new <type> <slug> [title] [--domain=<domain>]
```

Types: `scenario`, `feature`, `enhancement`

---

## Utility Commands

### init

Initialize a new Choragen project:

```bash
choragen init [options]
```

Options:
- `--non-interactive` - Use defaults without prompting
- `--skip-hooks` - Don't create git hooks
- `--name <name>` - Project name
- `--domain <domain>` - Primary domain

### hooks:install

Install git hooks:

```bash
choragen hooks:install
```

### validate

Run validation scripts:

```bash
choragen validate [--all|--quick|--ci|<validator-name>]
```

Presets:
- `--all` - Run all validators
- `--quick` - Run quick validators (links, agents-md)
- `--ci` - Run CI validators

### incomplete

Show incomplete work items:

```bash
choragen incomplete
```

Shows:
- TODOs/FIXMEs without CR/FR reference
- Stale requests (in doing/ > 3 days)
- Stale ADRs (in doing/ > 7 days)
- Stale tasks (in todo/ > 7 days)

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error or validation failure |
| 2 | Governance violation |

---

## Linked Use Cases

- [Create and Execute Task Chain](../use-cases/create-execute-task-chain.md)
- [Bootstrap New Project](../use-cases/bootstrap-new-project.md)

---

## Linked ADRs

- [ADR-001: Task File Format](../../adr/done/ADR-001-task-file-format.md)

---

## Acceptance Criteria

- [ ] Chain lifecycle commands create and manage chains
- [ ] Task lifecycle commands transition tasks through workflow states
- [ ] Governance check validates file mutations against policy
- [ ] Lock commands acquire and release file pattern locks
- [ ] Document creation commands create properly formatted docs
- [ ] Init command bootstraps new projects
- [ ] Validate command runs validation scripts

---

## Implementation

- `packages/cli/src/cli.ts`
