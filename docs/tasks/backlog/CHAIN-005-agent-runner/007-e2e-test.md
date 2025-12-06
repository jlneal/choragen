# Task: End-to-end test with real task

**Chain**: CHAIN-005-agent-runner  
**Task**: 007-e2e-test  
**Status**: backlog  
**Created**: 2025-12-06

---

## Objective

Run the agent runner end-to-end with a real task to validate the entire system works.

---

## Expected Files

Create:
- `packages/agent-runner/src/__tests__/e2e.test.ts` - E2E test
- A simple test task file for the agent to execute

---

## Acceptance Criteria

- [ ] Create a simple test task (e.g., add a comment to a file)
- [ ] Run agent runner against the task
- [ ] Verify agent completes successfully
- [ ] Verify file was modified correctly
- [ ] Test with both Anthropic and OpenAI (if keys available)
- [ ] `pnpm test` passes

---

## Notes

Create a minimal test task that:
1. Reads a file
2. Makes a small edit
3. Runs a verification command

This validates the full loop without being expensive.

**Test approach**:
- Use vitest with real API calls (skip if no API key)
- Create temp directory with test files
- Run agent
- Assert file changes

**Verification**:
```bash
ANTHROPIC_API_KEY=xxx pnpm --filter @choragen/agent-runner test
```
