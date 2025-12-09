# Task: Integration Tests for File Operations

**ID**: 008-integration-tests  
**Chain**: CHAIN-039-file-operations  
**Status**: done  
**Type**: impl  
**CR**: CR-20251207-027  

---

## Objective

Create comprehensive integration tests that verify the complete file operations flow including governance and lock checking.

---

## Acceptance Criteria

- [ ] Test: impl agent can read any file
- [ ] Test: impl agent can write to allowed paths
- [ ] Test: impl agent is denied writing to docs/**
- [ ] Test: control agent cannot use write_file
- [ ] Test: write_file is blocked when file is locked by another chain
- [ ] Test: audit logs are created for all file operations
- [ ] Test: governance violations are logged with denial reason
- [ ] All tests pass with `pnpm test`

---

## Implementation Notes

### Test Scenarios

```typescript
describe('File Operations Integration', () => {
  describe('read_file', () => {
    it('impl can read source files');
    it('impl can read docs files');
    it('control can read source files');
    it('returns error for non-existent file');
    it('supports offset and limit for large files');
  });

  describe('write_file', () => {
    it('impl can write to packages/**/src/**');
    it('impl can write to packages/**/__tests__/**');
    it('impl is denied writing to docs/adr/**');
    it('impl is denied writing to docs/requests/**');
    it('control cannot use write_file');
    it('createOnly fails if file exists');
    it('creates parent directories');
  });

  describe('governance integration', () => {
    it('validates file path against role patterns');
    it('returns clear error message on violation');
  });

  describe('lock integration', () => {
    it('allows write when no lock exists');
    it('allows write when current chain holds lock');
    it('denies write when another chain holds lock');
  });

  describe('audit logging', () => {
    it('logs successful read operations');
    it('logs successful write operations');
    it('logs denied operations with reason');
  });
});
```

---

## Files to Create/Modify

- `packages/cli/src/__tests__/file-operations.integration.test.ts` (create)

---

## Dependencies

- All previous tasks (001-007) must be complete
