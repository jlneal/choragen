# Change Request: Multi-Request Feature Branches

**ID**: CR-20251207-015  
**Domain**: workflow  
**Status**: todo  
**Created**: 2025-12-07  
**Owner**: agent  

---

## Summary

Support feature branches that span multiple related requests, enabling larger initiatives to be grouped while maintaining individual request traceability.

## Motivation

Some work naturally spans multiple requests:
- A feature with CR for design + FR for bug fixes discovered during implementation
- Phased rollouts where CR-001, CR-002, CR-003 are related
- Dependent requests that should ship together

Per-request branches (CR-014) work for isolated changes, but teams also need the ability to group related requests on a shared branch.

## Proposed Changes

### Feature Branch Concept

```yaml
# .choragen/feature-branches/feature-metrics.yaml
name: feature-metrics
branch: feature/metrics-system
base: main
requests:
  - CR-20251207-011   # Pipeline metrics
  - CR-20251207-012   # Web dashboard
status: active        # active | merged | abandoned
created: 2025-12-07
```

### CLI Commands

```bash
# Create feature branch grouping requests
choragen feature:create <name> --requests CR-001,CR-002 [--branch feature/name]

# Add request to existing feature branch
choragen feature:add <feature-name> <request-id>

# Remove request from feature branch
choragen feature:remove <feature-name> <request-id>

# List feature branches
choragen feature:list

# Show feature branch details
choragen feature:status <feature-name>

# Close feature branch (all requests must be done)
choragen feature:close <feature-name>
```

### Request Integration

When a request is part of a feature branch:

```markdown
**Feature Branch**: feature-metrics
```

`request:close` on individual requests doesn't merge—only `feature:close` merges when all requests are done.

### Validation

- Warn if closing a feature branch with open requests
- Prevent removing a request that has commits on the feature branch
- Track which commits belong to which request within the feature

## Affected Components

| Component | Change |
|-----------|--------|
| `@choragen/core` | Feature branch manager |
| `@choragen/cli` | `feature:*` commands |
| `.choragen/` | `feature-branches/` directory |

## Acceptance Criteria

- [ ] `feature:create` creates branch and metadata
- [ ] Requests can be added/removed from features
- [ ] `feature:close` validates all requests done before merge
- [ ] Request files show feature branch association
- [ ] Works alongside per-request branches (CR-014)

## Dependencies

- CR-20251207-013 (Configuration System)
- CR-20251207-014 (Request-per-Branch) - builds on branching infrastructure

## ADR Required

Yes - ADR for feature branch model and request grouping

---

## Commits

[Populated by `choragen request:close`]
