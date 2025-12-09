# Task: Add File Path Governance Validation

**ID**: 005-governance-file-validation  
**Chain**: CHAIN-039-file-operations  
**Status**: done  
**Type**: impl  
**CR**: CR-20251207-027  

---

## Objective

Extend the GovernanceGate to validate file paths against role-based governance rules before allowing write operations.

---

## Acceptance Criteria

- [ ] Extend `GovernanceGate.validate()` to check file paths for `write_file` tool
- [ ] Load governance rules from `choragen.governance.yaml`
- [ ] Validate file path against role's allowed patterns (from AGENTS.md boundaries)
- [ ] Return clear error message on governance violation
- [ ] Add `validateFilePath(path, role, action)` method
- [ ] Add unit tests for governance file validation

---

## Implementation Notes

### Governance Rules (from AGENTS.md)

**impl role ALLOWED**:
- `packages/**/src/**/*.ts`
- `packages/**/__tests__/**/*.ts`
- `packages/**/src/**/*.json`
- `*.config.*`
- `README.md` (package-level only)

**impl role DENIED**:
- `docs/tasks/**`
- `docs/requests/**`
- `docs/adr/**`

### Extended Validation

```typescript
validate(toolCall: ToolCall, role: AgentRole): ValidationResult {
  // Existing role-based check...
  
  // Phase 3: File path validation for write_file
  if (toolCall.name === 'write_file') {
    const { path } = toolCall.params as { path: string };
    const fileValidation = this.validateFilePath(path, role, 'modify');
    if (!fileValidation.allowed) {
      return fileValidation;
    }
  }
  
  return { allowed: true };
}
```

### Error Messages

```
"Role impl cannot modify docs/adr/todo/ADR-010.md - matches denied pattern docs/adr/**"
"Role impl cannot create docs/requests/CR-001.md - matches denied pattern docs/requests/**"
```

---

## Files to Create/Modify

- `packages/cli/src/runtime/governance-gate.ts` (modify - add file validation)
- `packages/cli/src/__tests__/governance-gate.test.ts` (modify - add tests)

---

## Dependencies

- Tasks 001-004 (file tools) should be done first
