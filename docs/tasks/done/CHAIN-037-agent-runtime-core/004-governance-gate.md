# Task: Governance Gate

**Chain**: CHAIN-037-agent-runtime-core  
**Task**: 004-governance-gate  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-08

---

## Objective

Create the governance gate that validates every tool call before execution.

---

## Context

The governance gate is the enforcement mechanism. Before any tool executes:
1. Check if the tool is allowed for the current role
2. Check if the action is permitted by governance rules
3. Return clear error messages for violations

For Phase 1, governance is primarily role-based tool filtering. File-level governance (which files can be modified) is Phase 3.

**Reference**: ADR-010 Section 3 (Governance Validation at Execution)

---

## Expected Files

Create:
- `packages/cli/src/runtime/governance-gate.ts` — Governance validation

---

## Acceptance Criteria

- [ ] `GovernanceGate` class with `validate(toolCall, role)` method
- [ ] Returns `{ allowed: true }` or `{ allowed: false, reason: string }`
- [ ] Validates tool is in allowed set for role
- [ ] Control agent cannot call impl-only tools
- [ ] Impl agent cannot call control-only tools
- [ ] Clear, actionable error messages for violations
- [ ] Unit tests for all validation scenarios
- [ ] TypeScript compiles without errors

---

## Constraints

- Phase 1 is role-based validation only
- Do NOT implement file path validation (Phase 3)
- Do NOT implement lock checking (Phase 3)

---

## Notes

**Interface**:
```typescript
interface GovernanceGate {
  validate(toolCall: ToolCall, role: AgentRole): ValidationResult;
}

interface ValidationResult {
  allowed: boolean;
  reason?: string;
}

type AgentRole = 'control' | 'impl';
```

**Example validation**:
```typescript
validate(toolCall: { name: 'task:approve', params: {...} }, role: 'impl') 
// Returns: { allowed: false, reason: 'Tool task:approve is not available to impl role' }
```

**Future Phase 3 additions** (not for this task):
- File path validation against `choragen.governance.yaml`
- Lock conflict detection
- Action-specific rules (create vs modify vs delete)

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
