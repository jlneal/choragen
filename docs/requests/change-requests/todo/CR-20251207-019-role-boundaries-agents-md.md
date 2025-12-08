# Change Request: Role Boundaries in AGENTS.md

**ID**: CR-20251207-019  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-07  
**Owner**: control-agent  

---

## What

Add explicit, enforceable role boundary rules to the root `AGENTS.md` file. These rules will be injected into agent context and serve as the authoritative source for what each role can and cannot do.

---

## Why

Role prohibitions are currently buried in `docs/agents/control-agent.md` and `docs/agents/impl-agent.md`. These docs are not automatically injected into agent context—only the root `AGENTS.md` is. This means agents may not see the prohibitions unless they explicitly read those files.

Moving critical role boundaries to `AGENTS.md` ensures they're always in context and provides a single source of truth for enforcement.

---

## Scope

**In Scope**:
- Add "Role Boundaries" section to root `AGENTS.md`
- Define file pattern restrictions per role
- Define action restrictions per role (commit, move, create)
- Add session role declaration requirement

**Out of Scope**:
- CLI enforcement (CR-20251207-021)
- Governance schema changes (CR-20251207-020)
- Automated validation of role compliance

---

## Affected Design Documents

- [docs/design/core/features/agent-workflow.md](../../design/core/features/agent-workflow.md)

---

## Linked ADRs

- [ADR-004: Agent Role Separation](../../adr/done/ADR-004-agent-role-separation.md)

---

## Acceptance Criteria

- [ ] `AGENTS.md` includes "Session Role Declaration" section requiring role announcement
- [ ] `AGENTS.md` includes "Role Boundaries" section with explicit allow/deny patterns
- [ ] Control agent restrictions: no editing `packages/*/src/**`, no creating tests
- [ ] Impl agent restrictions: no moving `docs/tasks/**`, no `git commit`, no creating CRs/FRs
- [ ] Both roles have clear file pattern rules that can later be enforced programmatically

---

## Commits

No commits yet.

---

## Implementation Notes

The role boundaries should be structured to mirror the governance schema format, enabling future programmatic extraction:

```markdown
### If ROLE = impl
- ✅ ALLOW: `packages/**/src/**/*.ts` (create, modify)
- ✅ ALLOW: `packages/**/__tests__/**/*.ts` (create, modify, delete)
- ❌ DENY: `docs/tasks/**` (move, delete)
- ❌ DENY: `git commit`
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
