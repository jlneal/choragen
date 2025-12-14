# Change Request: Pre-Push Gate

**ID**: CR-20251213-005  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-13  
**Owner**: agent  

---

## What

Introduce a **pre-push gate** that fires before `git push` to perform final validation checks. This is the last checkpoint before code leaves the local environment.

This CR introduces:
1. A `pre_push` gate type in the workflow system
2. Validation checks that run before push
3. Integration with the existing githook infrastructure

---

## Why

The post-commit audit catches issues after commits are created, but some validations are better suited to the pre-push phase:

- **Full test suite** — Running all tests on every commit is expensive; pre-push is the right time
- **Cross-commit validation** — Some checks only make sense across the full set of commits being pushed
- **Final traceability check** — Ensure all pushed commits have proper CR/FR references
- **WIP detection** — Prevent accidental push of work-in-progress commits

---

## Acceptance Criteria

- [ ] `pre_push` gate type added to workflow types
- [ ] Gate handler runs validation commands before push proceeds
- [ ] Gate can be configured with custom validation commands
- [ ] Gate integrates with existing `githooks/pre-push` script
- [ ] Failed validations block push with clear error messages
- [ ] Gate can be bypassed with explicit flag (for emergencies)

---

## Scope

**In scope:**
- Gate type definition and handler
- Default validation checks (tests, traceability)
- Githook integration
- Configuration via workflow template

**Out of scope:**
- Branch-specific rules
- Remote-specific rules
- PR/merge request integration

---

## Affected Design Documents

- [Standard Workflow](../../../design/core/features/standard-workflow.md) — Add pre-push gate concept
- [Governance Enforcement](../../../design/core/features/governance-enforcement.md) — Pre-push as governance checkpoint

---

## Linked ADRs

[Created during implementation]

---

## Commits

No commits yet.

---

## Task Chain

[Created during implementation]

---

## Implementation Notes

### Default Validations

The pre-push gate should run these checks by default:

1. **Test suite** — `pnpm test` or configured test command
2. **Lint check** — `pnpm lint` or configured lint command
3. **Traceability** — All commits reference a CR/FR
4. **No WIP** — No commits with "WIP" or "fixup" in message
5. **Request state** — No uncommitted changes to request files in `doing/`

### Gate Configuration

```yaml
stages:
  - name: Push
    type: implementation
    gate:
      type: pre_push
      commands:
        - pnpm test
        - pnpm lint
      checks:
        - traceability
        - no_wip
        - request_state
      bypassFlag: --force-push
```

### Githook Integration

The existing `githooks/pre-push` script should invoke the gate handler:

```bash
#!/bin/bash
choragen gate:pre-push "$@"
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
