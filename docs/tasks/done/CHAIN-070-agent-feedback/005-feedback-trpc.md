# Task: Add Feedback tRPC Router

**Chain**: CHAIN-070-agent-feedback  
**Task**: 005-feedback-trpc  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Add tRPC router for feedback operations. This enables the web UI to list, respond to, acknowledge, and dismiss feedback items.

---

## Expected Files

- `packages/web/src/server/routers/feedback.ts` - tRPC router
- `packages/web/src/server/routers/feedback.test.ts` - Router tests

---

## File Scope

- CREATE: `packages/web/src/server/routers/feedback.ts`
- CREATE: `packages/web/src/server/routers/feedback.test.ts`
- MODIFY: `packages/web/src/server/routers/index.ts` (add feedback router)

---

## Acceptance Criteria

- [ ] `feedback.list` query with workflowId, status, type, priority filters
- [ ] `feedback.get` query returns single feedback item
- [ ] `feedback.respond` mutation adds response and resolves feedback
- [ ] `feedback.dismiss` mutation dismisses feedback
- [ ] `feedback.acknowledge` mutation marks feedback as seen
- [ ] Input validation via Zod schemas
- [ ] Router tests cover all endpoints

---

## Notes

**Completed 2025-12-13** — Impl agent delivered:
- `packages/web/src/server/routers/feedback.ts` — tRPC router with list/get/respond/dismiss/acknowledge
- `packages/web/src/server/routers/feedback.test.ts` — 10 test cases with mocked FeedbackManager
- `packages/web/src/server/routers/index.ts` — Registered feedbackRouter

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
