# Enhancement: Multi-Repo Coordination

**Domain**: core  
**Status**: proposed  
**Priority**: low  
**Created**: 2025-12-06  

---

## Overview

Enable task chains that span multiple repositories, allowing coordinated work across microservices, monorepos with external dependencies, or related projects.

---

## Motivation

- **Microservices**: Changes often require updates across multiple services
- **Shared libraries**: Library updates need coordinated consumer updates
- **Platform teams**: Infrastructure changes affect multiple downstream repos
- **Monorepo boundaries**: Some organizations split work across repos
- **Open source**: Coordinating changes across related projects

---

## Proposed Solution

### Core Concepts

| Concept | Description |
|---------|-------------|
| Federated Chain | A chain that references tasks in multiple repos |
| Remote Task | A task that lives in a different repository |
| Sync Point | A task that blocks until remote tasks complete |
| Coordinator | The repo that owns the federated chain |

### Architecture

```
# Coordinator repo: platform/
docs/tasks/todo/CHAIN-001-api-v2/
├── 001-design.md           # Local task
├── 002-backend.md          # Remote: services/api
├── 003-frontend.md         # Remote: apps/web
└── 004-deploy.md           # Local sync point

# Remote task reference format
# 002-backend.md
---
remote:
  repo: git@github.com:org/services-api.git
  chain: CHAIN-042-api-v2
  task: 001-implement
---
```

### Coordination Protocol

```
1. Coordinator creates federated chain
2. Remote repos receive task creation webhook/notification
3. Remote repos work tasks independently
4. Status syncs back to coordinator
5. Sync points wait for all dependencies
```

### CLI Commands

| Command | Description |
|---------|-------------|
| `choragen chain:federate <chain-id>` | Convert chain to federated |
| `choragen task:remote <chain-id> <repo> <remote-chain>` | Add remote task reference |
| `choragen chain:sync <chain-id>` | Sync status from remote repos |
| `choragen chain:status --federated` | Show cross-repo status |

### Communication Options

1. **Git-based**: Push/pull task status via git
2. **Webhook**: HTTP callbacks on status changes
3. **Polling**: Periodic status checks
4. **MCP**: Model Context Protocol for agent coordination

---

## Dependencies

- **Task Chain Management**: Core feature must be stable
- **File Locking**: For concurrent updates across repos
- **MCP Server Integration**: For agent-to-agent coordination

---

## Open Questions

1. **Authentication**: How to handle cross-repo access?
2. **Conflict Resolution**: What happens if remote task is modified locally?
3. **Offline Support**: How to handle disconnected repos?
4. **Versioning**: How to handle schema differences across repos?
5. **Trust Model**: Which repos can create tasks in others?

---

## Related Documents

- [Task Chain Management](../features/task-chain-management.md)
- [File Locking](../features/file-locking.md)
- [Control Agent Workflow](../scenarios/control-agent-workflow.md)

---

## Acceptance Criteria

- [ ] Federated chains can reference remote tasks
- [ ] Status syncs from remote repositories
- [ ] Sync points block until dependencies complete
- [ ] Cross-repo status visible in single view
- [ ] Works with both public and private repos
