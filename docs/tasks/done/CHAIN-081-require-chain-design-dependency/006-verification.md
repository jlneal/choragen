# Task: Final verification and build check

**Chain**: CHAIN-081-require-chain-design-dependency  
**Task**: 006-verification  
**Status**: done  
**Type**: control  
**Created**: 2025-12-14

---

## Objective

Verify the complete implementation passes all checks and the rule works as expected.

---

## Verification Commands

```bash
# Build all packages
pnpm build

# Type check
pnpm --filter @choragen/eslint-plugin typecheck

# Run tests
pnpm --filter @choragen/eslint-plugin test

# Lint check
pnpm lint
```

---

## Acceptance Criteria

- [ ] All builds pass
- [ ] All tests pass
- [ ] Lint passes (or only unrelated warnings)
- [ ] Rule correctly flags invalid implementation chains
- [ ] Rule correctly allows valid patterns

---

## Notes

This is a control task - the control agent executes verification after impl tasks complete.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
