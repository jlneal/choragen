# Change Request: Request Closure Gate

**ID**: CR-20251213-007  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-13  
**Owner**: agent  

---

## What

Introduce a **request closure gate** that fires before moving a CR/FR from `doing/` to `done/`. This ensures all request-level requirements are satisfied before closure.

This CR introduces:
1. A `request_close` gate type or validation hook
2. Request-level completeness verification
3. Integration with `choragen request:close` command

---

## Why

Requests can currently be closed without verification that:
- The commits section is populated with actual commit references
- Completion notes summarize what was implemented
- Linked ADRs are in the correct state (`done/` not `todo/`)
- All associated chains are complete
- The request file itself is properly formatted

A request closure gate provides a final checkpoint before the request is marked complete.

---

## Acceptance Criteria

- [ ] `choragen request:close` runs validation before moving file
- [ ] Gate verifies commits section is not empty
- [ ] Gate verifies completion notes are present and non-placeholder
- [ ] Gate verifies linked ADRs are in `done/` or `doing/`
- [ ] Gate verifies all linked chains are complete
- [ ] Failed validations block closure with actionable messages
- [ ] Gate can be bypassed with explicit flag (for edge cases)

---

## Scope

**In scope:**
- Request file validation
- Commit reference verification
- Completion notes verification
- ADR state verification
- Chain completion verification

**Out of scope:**
- Automated quality assessment of completion notes
- Cross-request validation
- Historical request migration

---

## Affected Design Documents

- [Standard Workflow](../../../design/core/features/standard-workflow.md) — Add request closure gate concept
- [Development Pipeline](../../../design/DEVELOPMENT_PIPELINE.md) — Request lifecycle validation

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

### Validation Checks

The request closure gate should verify:

1. **Commits section** — Not empty, not placeholder text
2. **Completion notes** — Present and not placeholder
3. **ADR state** — Linked ADRs moved from `todo/` to `done/`
4. **Chain state** — All linked chains have `reviewStatus: approved`
5. **File format** — Status field updated to `done`

### CLI Integration

```bash
# Current behavior
choragen request:close CR-20251213-003

# With gate
choragen request:close CR-20251213-003
# → Runs validations
# → If pass: moves file to done/
# → If fail: prints errors, does not move

# Bypass for emergencies
choragen request:close CR-20251213-003 --force
```

### Validation Script

This could leverage the existing `validate-request-completion.mjs` script, making it a blocking gate rather than just a pre-commit check.

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
