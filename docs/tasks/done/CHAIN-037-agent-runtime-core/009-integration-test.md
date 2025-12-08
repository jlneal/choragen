# Task: Integration Test

**Chain**: CHAIN-037-agent-runtime-core  
**Task**: 009-integration-test  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-08

---

## Objective

Create an end-to-end integration test that verifies the complete agent runtime works.

---

## Context

Individual components have unit tests. This task creates an integration test that:
1. Starts an agent session with a mock LLM provider
2. Verifies the loop executes correctly
3. Verifies governance enforcement works
4. Verifies tool execution works
5. Verifies session state is persisted

---

## Expected Files

Create:
- `packages/cli/src/runtime/__tests__/integration.test.ts` — Integration tests

---

## Acceptance Criteria

- [ ] Test: Control agent can call allowed tools
- [ ] Test: Control agent is denied impl-only tools
- [ ] Test: Impl agent can call allowed tools
- [ ] Test: Impl agent is denied control-only tools
- [ ] Test: Tool results are added to conversation
- [ ] Test: Governance violations return clear error messages
- [ ] Test: Session terminates on end_turn
- [ ] Test: Session terminates on max iterations
- [ ] Test: Session state is persisted to file
- [ ] Test: Dry-run mode doesn't execute tools
- [ ] All tests pass with mocked LLM provider
- [ ] TypeScript compiles without errors

---

## Constraints

- Use mocked LLM provider (don't call real APIs in tests)
- Tests should be deterministic and fast
- Clean up test artifacts (session files) after tests

---

## Notes

**Mock Provider Pattern**:
```typescript
class MockLLMProvider implements LLMProvider {
  private responses: ChatResponse[];
  private callIndex = 0;

  constructor(responses: ChatResponse[]) {
    this.responses = responses;
  }

  async chat(messages: Message[], tools: Tool[]): Promise<ChatResponse> {
    return this.responses[this.callIndex++];
  }
}
```

**Test Scenario: Governance Enforcement**:
```typescript
test('impl agent cannot call task:approve', async () => {
  const mockProvider = new MockLLMProvider([
    {
      content: 'I will approve this task',
      toolCalls: [{ name: 'task:approve', params: { chainId: 'X', taskId: 'Y' } }],
      stopReason: 'tool_use'
    },
    {
      content: 'I understand I cannot approve tasks',
      toolCalls: [],
      stopReason: 'end_turn'
    }
  ]);

  const result = await runAgentSession({
    role: 'impl',
    provider: mockProvider,
    workspaceRoot: testDir
  });

  expect(result.toolCalls[0].governanceResult.allowed).toBe(false);
});
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
