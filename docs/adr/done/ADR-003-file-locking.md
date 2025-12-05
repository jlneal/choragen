# ADR-003: File Locking for Parallel Chains

**Status**: Done  
**Created**: 2025-12-05  
**Linked CR**: CR-20251205-001  

---

## Context

Multiple task chains may run in parallel. Without coordination, they could:
1. Edit the same files simultaneously
2. Create conflicting changes
3. Overwrite each other's work

We need advisory locking to prevent collisions.

---

## Decision

### Lock File Format

Locks are stored in `.choragen/locks.json`:

```json
{
  "version": 1,
  "chains": {
    "CHAIN-001-profile-backend": {
      "files": ["app/api/profile/**", "lib/profile/**"],
      "acquired": "2025-12-05T14:40:00Z",
      "agent": "cascade-session-abc",
      "expiresAt": "2025-12-06T14:40:00Z"
    }
  }
}
```

### Lock Lifecycle

1. **Acquire**: Before starting a chain, acquire locks for expected file patterns
2. **Check**: Before each file mutation, verify no conflicting locks
3. **Extend**: Long-running chains can extend lock expiration
4. **Release**: When chain completes, release all locks

### Collision Detection

Two patterns "overlap" if they could match the same file:
- `app/**` and `app/api/route.ts` overlap
- `lib/auth/**` and `lib/profile/**` do not overlap

If a chain tries to acquire a lock that overlaps with an existing lock, the acquisition fails.

### Expiration

Locks expire after 24 hours by default. This prevents orphaned locks from blocking work indefinitely if an agent crashes.

---

## Consequences

**Positive**:
- Prevents concurrent edits to same files
- Advisory (not enforced at filesystem level)
- Expiration prevents permanent blocks
- Pattern-based (not file-by-file)

**Negative**:
- Coarse-grained (whole patterns, not lines)
- Requires discipline to acquire locks
- Overlap detection is heuristic

**Mitigations**:
- CLI commands make locking easy
- Governance check can warn about unlocked mutations
- Expiration prevents permanent blocks

---

## Implementation

- `packages/core/src/locks/types.ts`
- `packages/core/src/locks/lock-manager.ts`
