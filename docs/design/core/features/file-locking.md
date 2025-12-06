# Feature: File Locking

**Domain**: core  
**Created**: 2025-12-05  
**Status**: Implemented  

---

## Overview

Advisory file locking prevents parallel task chains from editing the same files simultaneously.

---

## Capabilities

### Lock Commands

| Command | Description |
|---------|-------------|
| `lock:acquire <chain-id> <pattern>...` | Acquire locks for file patterns |
| `lock:release <chain-id>` | Release all locks for a chain |
| `lock:status` | Show all active locks |

### Lock Properties

- **Pattern-based**: Lock glob patterns, not individual files
- **Chain-scoped**: Each chain has its own locks
- **Expiring**: Locks expire after 24 hours by default
- **Advisory**: Not enforced at filesystem level

---

## Lock File

`.choragen/locks.json`:

```json
{
  "version": 1,
  "chains": {
    "CHAIN-001-profile": {
      "files": ["app/api/profile/**", "lib/profile/**"],
      "acquired": "2025-12-05T14:40:00Z",
      "agent": "cascade-session-abc",
      "expiresAt": "2025-12-06T14:40:00Z"
    }
  }
}
```

---

## Collision Detection

When acquiring locks, the system checks for overlapping patterns:

```bash
$ choragen lock:acquire CHAIN-002 "app/api/**"
Error: Lock conflict: app/api/** overlaps with app/api/profile/** (held by CHAIN-001-profile)
```

---

## Linked ADRs

- [ADR-003: File Locking](../../adr/done/ADR-003-file-locking.md)

---

## Linked Personas

- [AI Agent](../personas/ai-agent.md)
- [Team Lead](../personas/team-lead.md)
- [Open Source Maintainer](../personas/open-source-maintainer.md)

---

## Linked Use Cases

- [Create and Execute Task Chain](../use-cases/create-execute-task-chain.md)

---

## Linked Scenarios

- [Control Agent Workflow](../scenarios/control-agent-workflow.md)

---

## Acceptance Criteria

- [ ] `lock:acquire` command acquires locks for specified file patterns
- [ ] `lock:release` command releases all locks for a chain
- [ ] `lock:status` command shows all active locks
- [ ] Lock conflicts are detected when patterns overlap
- [ ] Locks expire after 24 hours by default
- [ ] Lock state is persisted in `.choragen/locks.json`

---

## Implementation

- `packages/core/src/locks/`
