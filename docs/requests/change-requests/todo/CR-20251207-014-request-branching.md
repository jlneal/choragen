# Change Request: Request-per-Branch Workflow

**ID**: CR-20251207-014  
**Domain**: workflow  
**Status**: todo  
**Created**: 2025-12-07  
**Owner**: agent  

---

## Summary

Add optional git branching support where each request (CR/FR) can have its own branch, enabling standard PR workflows and clean change isolation.

## Motivation

Many teams use branch-per-feature workflows:
- Clean separation of changes
- Easy code review via PRs
- Simple rollback (revert merge)
- CI/CD integration per branch

Currently Choragen works on a single branch. This CR adds optional branching that integrates with the request lifecycle.

## Proposed Changes

### Configuration

```yaml
# .choragen/config.yaml
workflow:
  branching:
    enabled: true
    strategy: per-request              # per-request | manual
    naming: "request/{type}/{id}"      # Branch name template
    base-branch: main                  # Branch to create from
    auto-create: on-doing              # on-doing | manual
    auto-merge: false                  # Auto-merge on request:close
```

### Branch Naming

Template variables:
- `{type}` → cr or fr
- `{id}` → full ID (e.g., 20251207-010)
- `{slug}` → request slug if available

Examples:
- `request/cr/20251207-010`
- `cr/20251207-010-task-rework`
- `feature/CR-20251207-010`

### CLI Commands

```bash
# Create branch for request (if not auto-create)
choragen request:branch <request-id>

# Switch to request's branch
choragen request:checkout <request-id>

# Show branch status
choragen request:branch-status <request-id>
```

### Lifecycle Integration

**When `auto-create: on-doing`**:
1. `request:start` (moves to doing) creates branch
2. Work happens on branch
3. `request:close` optionally merges to base

**When `auto-create: manual`**:
1. User runs `request:branch` when ready
2. User manages branch lifecycle
3. `request:close` warns if branch exists but isn't merged

### Request Metadata

Track branch in request file:

```markdown
**Branch**: request/cr/20251207-010
**Branch Status**: active | merged | abandoned
```

## Affected Components

| Component | Change |
|-----------|--------|
| `@choragen/core` | Branch manager, git operations |
| `@choragen/cli` | `request:branch`, `request:checkout`, config integration |
| Request templates | Add branch fields |

## Acceptance Criteria

- [ ] Config controls branching behavior
- [ ] `request:branch` creates branch with configured naming
- [ ] `request:checkout` switches to request's branch
- [ ] Branch name recorded in request metadata
- [ ] Works with `branching.enabled: false` (no-op)
- [ ] Clear error if git operations fail

## Dependencies

- CR-20251207-013 (Configuration System) - for config schema

## Future Requests (Out of Scope)

- Multi-request branches (feature branches spanning requests)
- PR creation integration (GitHub/GitLab API)
- Branch protection rules

## ADR Required

Yes - ADR for branching strategy and git integration

---

## Commits

[Populated by `choragen request:close`]
