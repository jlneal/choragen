# Change Request: Contracts Workflow Integration

**ID**: CR-20251211-015  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Integrate runtime contracts with the workflow orchestration system, enabling contract gates that block workflow advancement and agent tools for contract verification.

---

## Why

Contracts without enforcement are advisory. To achieve the trust layer vision—where generated code doesn't need human review—contracts must be **enforced**:

- Workflow gates fail if contract violations occur during verification
- Agents can check contracts before completing work
- Contract coverage requirements ensure new code has contracts

This completes the trust layer: governance controls access, linting verifies structure, tests verify known behavior, contracts verify runtime invariants.

---

## Scope

**In Scope**:
- New gate type: `contract_pass` — requires zero contract violations
- New gate type: `contract_coverage` — requires minimum contract coverage
- Agent tool: `check_contracts` — verify contracts pass
- Agent tool: `add_contract` — add contract to function (future)
- Contract results in workflow messages
- Workflow template updates to include contract gates

**Out of Scope**:
- Automatic contract generation (future enhancement)
- Contract mutation testing
- Cross-service contract verification

---

## Acceptance Criteria

- [ ] `contract_pass` gate type blocks if violations occur during tests
- [ ] `contract_pass` supports mode configuration (enforce vs log)
- [ ] `contract_coverage` gate type blocks if coverage below threshold
- [ ] Agents can call `check_contracts` tool to verify contracts
- [ ] Contract violations appear as system messages in workflow chat
- [ ] Standard workflow template includes contract gate
- [ ] Gate failure message includes violation summary
- [ ] Contract gates can be configured as warn-only for transition

---

## Affected Design Documents

- [Runtime Contract Enforcement](../../../design/core/features/runtime-contract-enforcement.md)
- [Workflow Orchestration](../../../design/core/features/workflow-orchestration.md)

---

## Linked ADRs

- ADR-011: Workflow Orchestration
- ADR-014: Runtime Contract Enforcement

---

## Dependencies

- **CR-20251211-012**: Contracts Core Infrastructure
- **CR-20251211-013**: Schema Contracts
- **CR-20251211-014**: Contracts Web Dashboard

---

## Commits

No commits yet.

---

## Implementation Notes

New gate types in workflow templates:

```yaml
stages:
  - name: implementation
    type: implementation
    gate:
      type: chain_complete
  
  - name: contracts
    type: verification
    gate:
      type: contract_pass
      mode: enforce
      allowedViolations: 0
  
  - name: contract-coverage
    type: verification
    gate:
      type: contract_coverage
      threshold: 50  # % of functions with contracts
```

Gate implementation:

```typescript
case "contract_pass": {
  // Run tests with contract collection
  const result = await testRunner.run({ collectContracts: true });
  const violations = await contractEngine.getViolations();
  
  if (violations.length > gate.allowedViolations) {
    throw new Error(
      `Contract gate failed: ${violations.length} violations\n` +
      violations.map(v => `  ${v.contractId}: ${v.message}`).join("\n")
    );
  }
  return;
}

case "contract_coverage": {
  const coverage = await contractEngine.getCoverage();
  if (coverage.percentage < gate.threshold) {
    throw new Error(
      `Contract coverage ${coverage.percentage}% below threshold ${gate.threshold}%`
    );
  }
  return;
}
```

Agent tool:

```typescript
{
  name: "check_contracts",
  description: "Verify runtime contracts pass for specified code",
  parameters: {
    files: { type: "array", items: { type: "string" } },
    runTests: { type: "boolean", default: true },
  },
  execute: async ({ files, runTests }) => {
    if (runTests) {
      await testRunner.run({ files, collectContracts: true });
    }
    const violations = await contractEngine.getViolations(files);
    return {
      passed: violations.length === 0,
      violations: violations.map(v => ({
        contract: v.contractId,
        message: v.message,
        location: `${v.location.file}:${v.location.line}`,
      })),
      coverage: await contractEngine.getCoverage(files),
    };
  },
}
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
