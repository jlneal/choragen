# Change Request: Lint Workflow Integration

**ID**: CR-20251211-007  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Integrate Universal Artifact Linting with the workflow orchestration system, enabling lint gates that block workflow advancement and stage-scoped linting.

---

## Why

Linting without enforcement is advisory. To achieve the trust layer vision—where generated artifacts don't need human review—lint must be **enforced**:

- Workflow gates fail if lint errors exist
- Each stage can have different lint requirements
- Agents receive lint feedback before human sees output
- Trust score gates can require minimum threshold

This closes the loop: governance controls access, linting verifies quality, workflow enforces both.

---

## Scope

**In Scope**:
- New gate type: `lint_pass` — requires zero lint errors for specified artifact types
- New gate type: `trust_threshold` — requires trust score above threshold
- Stage-scoped linting: `choragen lint --stage=implementation`
- Lint results included in workflow messages (violations as system messages)
- Auto-lint before gate evaluation
- Agent tool: `lint_check` — run lint and get results for self-correction
- Workflow template updates to include lint gates

**Out of Scope**:
- Auto-fix in agent sessions (future enhancement)
- Custom lint gates per-project (use standard gates)

---

## Acceptance Criteria

- [ ] `lint_pass` gate type blocks advancement if lint errors exist
- [ ] `lint_pass` gate can specify artifact types to check
- [ ] `trust_threshold` gate type blocks if score below threshold
- [ ] `choragen lint --stage=<stage>` filters rules by stage relevance
- [ ] Lint violations appear as system messages in workflow chat
- [ ] Agents can call `lint_check` tool to validate their work
- [ ] Standard workflow template includes lint gate before completion
- [ ] Hotfix template includes lint gate with reduced scope
- [ ] Gate failure message includes violation summary
- [ ] Gate can be configured to warn-only (non-blocking) for transition period

---

## Affected Design Documents

- [Universal Artifact Linting](../../../design/core/features/universal-artifact-linting.md)
- [Workflow Orchestration](../../../design/core/features/workflow-orchestration.md)

---

## Linked ADRs

- ADR-011: Workflow Orchestration
- ADR-012: Universal Artifact Linting

---

## Dependencies

- **CR-20251211-004**: Lint Core Infrastructure
- **CR-20251211-005**: Lint Source Integration
- **CR-20251211-006**: Lint Web Dashboard (for violation display in chat)

---

## Commits

No commits yet.

---

## Implementation Notes

New gate types in workflow templates:

```yaml
# Standard template with lint gates
stages:
  - name: implementation
    type: implementation
    gate:
      type: chain_complete
  
  - name: lint
    type: verification
    gate:
      type: lint_pass
      artifactTypes:
        - change-request
        - typescript-source
        - test
  
  - name: verification
    type: verification
    gate:
      type: verification_pass
      commands: ["pnpm build", "pnpm test"]
  
  - name: completion
    type: review
    gate:
      type: trust_threshold
      threshold: 95
```

Gate implementation:

```typescript
// In workflow manager gate satisfaction logic
case "lint_pass": {
  const violations = await lintEngine.scan({
    artifactTypes: gate.artifactTypes,
    severity: "error", // Only errors block
  });
  if (violations.length > 0) {
    throw new Error(`Lint gate failed: ${violations.length} errors`);
  }
  return;
}

case "trust_threshold": {
  const score = await lintEngine.getTrustScore();
  if (score.overall < gate.threshold) {
    throw new Error(`Trust score ${score.overall}% below threshold ${gate.threshold}%`);
  }
  return;
}
```

Agent tool for self-correction:

```typescript
{
  name: "lint_check",
  description: "Run lint on specified files or artifact types to check for violations",
  parameters: {
    files: { type: "array", items: { type: "string" } },
    artifactTypes: { type: "array", items: { type: "string" } },
  },
  execute: async ({ files, artifactTypes }) => {
    const violations = await lintEngine.scan({ files, artifactTypes });
    return { violations, passed: violations.filter(v => v.severity === "error").length === 0 };
  },
}
```

Stage-scoped linting maps stages to relevant artifact types:
- `request` → change-request, fix-request
- `design` → feature, scenario, adr
- `implementation` → typescript-source, test, chain, task
- `verification` → all types
- `review` → all types

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
