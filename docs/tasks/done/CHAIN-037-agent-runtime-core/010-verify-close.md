# Task: Verify and Close Chain

**Chain**: CHAIN-037-agent-runtime-core  
**Task**: 010-verify-close  
**Status**: done  
**Type**: control  
**Created**: 2025-12-08

---

## Objective

Verify all acceptance criteria are met and close the chain.

---

## Context

This is the final task in the chain. The control agent:
1. Runs all verification commands
2. Checks each CR acceptance criterion
3. Moves the CR to done
4. Moves the ADR to done
5. Closes the chain

---

## Acceptance Criteria

- [ ] `pnpm build` passes
- [ ] `pnpm test` passes (all packages)
- [ ] `pnpm lint` passes
- [ ] `choragen agent:start --role=control --dry-run` works
- [ ] `choragen agent:start --role=impl --dry-run` works
- [ ] All CR-20251207-025 acceptance criteria verified
- [ ] CR moved to `docs/requests/change-requests/done/`
- [ ] ADR-010 moved to `docs/adr/done/`
- [ ] Chain tasks moved to `docs/tasks/done/CHAIN-037-agent-runtime-core/`
- [ ] Commit made with `[CR-20251207-025]` reference

---

## Verification Commands

```bash
# Build
pnpm build

# Test
pnpm test

# Lint
pnpm lint

# Dry run tests
pnpm choragen agent:start --role=control --dry-run
pnpm choragen agent:start --role=impl --dry-run
```

---

## CR Acceptance Criteria Checklist

From CR-20251207-025:

- [ ] `choragen agent:start --role=control` starts a control agent session
- [ ] `choragen agent:start --role=impl` starts an impl agent session
- [ ] Control role sees only control-allowed tools
- [ ] Impl role sees only impl-allowed tools
- [ ] Tool calls are validated against governance before execution
- [ ] Governance violations are rejected with clear error messages
- [ ] Session outputs tool calls and results to console
- [ ] Session metrics are recorded to `.choragen/metrics/`
- [ ] `--model` flag allows specifying LLM model
- [ ] `--dry-run` flag shows what would happen without executing

---

## Notes

This is a control task — the control agent executes this directly without handoff to an implementation agent.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
