# Fix Request: Update Documentation for Complete Traceability Chain

**ID**: FR-20251207-005  
**Domain**: docs  
**Status**: todo  
**Severity**: medium  
**Created**: 2025-12-07  
**Owner**: agent  

---

## Problem

The traceability chain documentation is incomplete. It shows:
```
Persona → Scenario → Use Case → Feature → CR/FR → ADR → Implementation
```

But the full chain now includes **Commits**:
```
Persona → Scenario → Use Case → Feature → CR/FR → ADR → Implementation → Commits
```

The `request:close` command populates the `## Commits` section, completing the bi-directional link, but docs don't reflect this.

---

## Impact

- **Incomplete documentation** — New contributors don't see the full picture
- **Process gap** — People may not know to use `request:close`
- **Inconsistency** — Different docs show different chains

---

## Proposed Fix

Update all documentation that mentions the traceability chain to include Commits:

1. `docs/design/core/features/user-value-traceability.md`
2. `docs/design/DEVELOPMENT_PIPELINE.md`
3. `docs/architecture.md`
4. `docs/agents/control-agent.md`
5. `AGENTS.md` (root)

Also document the `request:close` command as the mechanism for completing the chain.

---

## Acceptance Criteria

- [ ] All traceability chain diagrams include "→ Commits"
- [ ] `request:close` command documented in workflow
- [ ] Bi-directional nature explained (Request ↔ Commits)

---

## Completion Notes

[Added when moved to done/]
