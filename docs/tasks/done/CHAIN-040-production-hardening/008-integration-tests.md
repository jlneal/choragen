# Task: Integration Tests for Production Features

**ID**: 008-integration-tests  
**Chain**: CHAIN-040-production-hardening  
**Status**: done  
**Type**: impl  
**CR**: CR-20251207-028  

---

## Objective

Add integration tests that verify all Phase 4 features work together correctly.

---

## Acceptance Criteria

- [ ] Test: Session resume after simulated crash
- [ ] Test: Cost limit triggers graceful shutdown
- [ ] Test: Human checkpoint approval flow (mocked stdin)
- [ ] Test: Human checkpoint rejection flow
- [ ] Test: Retry with backoff on transient error
- [ ] Test: Provider switching (mock providers)
- [ ] Test: Graceful shutdown saves session state
- [ ] All tests pass in CI environment

---

## Implementation Notes

### Test Structure

```typescript
describe('Production Hardening Integration', () => {
  describe('Session Resume', () => {
    it('should resume from last saved state after crash');
    it('should continue with correct message history');
  });
  
  describe('Cost Controls', () => {
    it('should warn at 80% of token limit');
    it('should stop at 100% of token limit');
    it('should track cost across multiple turns');
  });
  
  describe('Human Checkpoints', () => {
    it('should pause for approval on sensitive actions');
    it('should continue on approval');
    it('should reject and inform agent on denial');
  });
  
  describe('Error Recovery', () => {
    it('should retry transient errors with backoff');
    it('should not retry permanent errors');
    it('should save state on unrecoverable error');
  });
});
```

### Mock Providers

```typescript
class MockProvider implements LLMProvider {
  private responses: LLMResponse[];
  private callCount = 0;
  
  constructor(responses: LLMResponse[]) {
    this.responses = responses;
  }
  
  async complete(): Promise<LLMResponse> {
    return this.responses[this.callCount++];
  }
}
```

---

## Files to Create/Modify

- `packages/cli/src/__tests__/production-hardening.integration.test.ts` (create)
- `packages/cli/src/__tests__/helpers/mock-provider.ts` (create if needed)
