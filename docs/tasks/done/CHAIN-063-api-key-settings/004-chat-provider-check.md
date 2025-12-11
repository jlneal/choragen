# Task: Chat Provider Validation

**Chain**: CHAIN-063-api-key-settings  
**Task**: 004-chat-provider-check  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Add validation to the chat interface that checks for a configured provider before allowing agent invocation.

---

## Context

The chat interface should not allow users to start workflows or send messages to agents if no LLM provider is configured. This prevents confusing errors and guides users to the settings page.

---

## Expected Files

- `packages/web/src/components/chat/chat-input.tsx` — Add provider check
- `packages/web/src/components/chat/provider-required-banner.tsx` — Banner component
- `packages/web/src/hooks/use-provider-status.ts` — Hook to check provider config

---

## Acceptance Criteria

- [ ] Chat input is disabled when no provider is configured
- [ ] Banner displays: "No LLM provider configured. [Go to Settings]"
- [ ] Banner links to `/settings` page
- [ ] Provider status is cached and refreshed on settings page return
- [ ] Workflow creation is blocked without configured provider
- [ ] Clear error message if provider becomes unavailable mid-session

---

## Constraints

- Don't block viewing existing chat history
- Provider check should be fast (use cached status)
- Handle edge case: provider configured but key invalid

---

## Notes

The check should query `settings.getProviders` and verify at least one provider returns `true`.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
