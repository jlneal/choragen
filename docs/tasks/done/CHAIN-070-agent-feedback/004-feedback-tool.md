# Task: Add feedback:create Agent Tool

**Chain**: CHAIN-070-agent-feedback  
**Task**: 004-feedback-tool  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Add the `feedback:create` tool to the agent tool registry. This tool allows agents to create feedback items during workflow execution, providing structured communication back to humans.

---

## Expected Files

- `packages/core/src/tools/feedback-create.ts` - Tool implementation
- `packages/core/src/tools/__tests__/feedback-create.test.ts` - Unit tests

---

## File Scope

- CREATE: `packages/core/src/tools/feedback-create.ts`
- CREATE: `packages/core/src/tools/__tests__/feedback-create.test.ts`
- MODIFY: `packages/core/src/tools/index.ts` (register tool)
- MODIFY: `.choragen/tools/index.yaml` (add tool definition)

---

## Acceptance Criteria

- [ ] Tool accepts type, content, context, and priority parameters
- [ ] Tool validates input against Zod schemas
- [ ] Tool creates feedback via FeedbackManager
- [ ] Tool returns created feedback ID
- [ ] Context supports files, codeSnippets, and options
- [ ] Tool registered in agent runtime
- [ ] Unit tests cover success and validation error cases

---

## Notes

**Completed 2025-12-13** — Impl agent delivered:
- `packages/core/src/tools/feedback-create.ts` — Tool with Zod validation, FeedbackManager integration, structured results
- `packages/core/src/tools/__tests__/feedback-create.test.ts` — 5 test cases
- `packages/core/src/tools/index.ts` — Added export
- `.choragen/tools/index.yaml` — Updated tool definition with full parameter schema

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
