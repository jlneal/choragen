# Change Request: Override Audit Core Infrastructure

**ID**: CR-20251211-028  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Build the foundational infrastructure for Override Audit Trail: override capture, storage, rationale requirements, and CLI commands.

---

## Why

The trust layer is only as strong as its enforcement. When humans bypass gates without accountability:
- Bypasses are invisible
- Patterns go undetected
- Trust metrics become unreliable
- Bad practices become normalized

This CR establishes the core infrastructure for tracking and auditing gate overrides.

---

## Scope

**In Scope**:
- `@choragen/core` override-audit module
- Override data model (who, when, what, why)
- Override capture hook in workflow gate system
- Rationale form with category and description
- Override storage (JSON file initially)
- Configuration via `.choragen/override-audit.yaml`
- CLI commands: `choragen overrides`, `choragen overrides show <id>`

**Out of Scope**:
- Web dashboard — CR-20251211-029
- Alerting and reports — CR-20251211-030

---

## Acceptance Criteria

- [ ] Override data model with: id, timestamp, userId, gateType, failureReason, rationale
- [ ] Override captured when workflow gate is bypassed
- [ ] Rationale required with category dropdown
- [ ] Rationale categories: false-positive, time-pressure, known-issue, other
- [ ] Rationale description with configurable minimum length
- [ ] Optional ticket reference field
- [ ] Overrides stored in `.choragen/overrides.json`
- [ ] Configuration loads from `.choragen/override-audit.yaml`
- [ ] `choragen overrides` lists recent overrides
- [ ] `choragen overrides show <id>` shows override detail
- [ ] Override retention policy (delete after N days)

---

## Affected Design Documents

- [Override Audit Trail](../../../design/core/features/override-audit.md)

---

## Linked ADRs

- ADR-018: Override Audit Trail (to be created)

---

## Dependencies

- Workflow orchestration system (gates must support override callback)

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create:

```
packages/core/src/override-audit/
├── index.ts                    # Barrel exports
├── types.ts                    # Override, OverrideRationale, etc.
├── capture.ts                  # Override capture logic
├── storage.ts                  # Override persistence
├── config.ts                   # Configuration loader
└── __tests__/
    ├── capture.test.ts
    └── storage.test.ts
```

CLI commands:
```
packages/cli/src/commands/overrides.ts
packages/cli/src/commands/overrides-show.ts
```

Integration with workflow gates:
```typescript
// In workflow gate handler
if (!result.passed && result.canOverride) {
  const decision = await promptOverrideDecision(gate, result);
  if (decision.action === "override") {
    await overrideAudit.capture({
      gateType: gate.type,
      gateName: gate.name,
      failureReason: result.failureReason,
      workflowId: workflow.id,
      rationale: decision.rationale,
    });
    return "continue";
  }
}
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
