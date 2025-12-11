# Task: Settings tRPC Router

**Chain**: CHAIN-063-api-key-settings  
**Task**: 002-settings-trpc-router  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Create tRPC router for settings management with endpoints for getting provider status, updating API keys, and testing connections.

---

## Context

The settings page needs server-side endpoints to:
1. Get which providers are configured (without revealing keys)
2. Save new API keys to config file
3. Test that a key works by making a simple API call

---

## Expected Files

- `packages/web/src/server/routers/settings.ts` — Settings tRPC router
- `packages/web/src/server/routers/index.ts` — Add settings router to app router

---

## Acceptance Criteria

- [ ] `settings.getProviders` — Returns `{ anthropic: boolean, openai: boolean, google: boolean, ollama: boolean }`
- [ ] `settings.updateApiKey` — Saves key to `.choragen/config.json` (input: provider, apiKey)
- [ ] `settings.testConnection` — Validates key works (input: provider, apiKey)
- [ ] Keys are never returned to client, only "configured" status
- [ ] Proper error handling for invalid keys, file write failures
- [ ] Integration tests for router endpoints

---

## Constraints

- Use existing tRPC patterns from other routers in the project
- Test connection should make minimal API call (e.g., list models)
- Config file writes should be atomic (write to temp, then rename)

---

## Notes

Test connection implementations:
- **Anthropic**: `GET /v1/models` or simple completion
- **OpenAI**: `GET /v1/models`
- **Google**: Gemini API model list
- **Ollama**: `GET /api/tags` (local, no auth needed)

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
