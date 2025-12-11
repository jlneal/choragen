# Change Request: API Key Settings Page

**ID**: CR-20251211-001  
**Domain**: web  
**Status**: done  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Add a settings page to the web dashboard where users can configure LLM provider API keys. Keys are stored in `.choragen/config.json` and loaded by the server at runtime.

---

## Why

Currently, API keys must be set as environment variables before starting the web server. This creates friction:

- Users must know which env vars to set (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, etc.)
- No visibility into which providers are configured
- No way to update keys without restarting the server
- Blocks the chat interface from being functional out of the box

A settings page provides a unified, discoverable way to configure the agent runtime from within the web app.

---

## Scope

**In Scope**:
- `/settings` route with API key configuration form
- Support for multiple providers: Anthropic, OpenAI, Google (Gemini), Ollama
- Secure storage in `.choragen/config.json` (server-side only, never sent to client)
- Server reads config on startup, with env vars as override
- Validation that keys are present before allowing agent sessions
- Visual indicator of which providers are configured
- tRPC mutations: `settings.getProviders`, `settings.updateApiKey`, `settings.testConnection`

**Out of Scope**:
- Encrypted storage (keys stored in plaintext in config file, same as env vars)
- Per-project key configuration (single global config for now)
- Key rotation or expiration

---

## Acceptance Criteria

- [x] `/settings` route exists with API key configuration UI
- [x] Can enter API keys for Anthropic, OpenAI, Google, Ollama
- [x] Keys are saved to `.choragen/config.json`
- [x] Server loads keys from config file on startup
- [x] Environment variables override config file values
- [x] Settings page shows which providers are configured (without revealing keys)
- [x] "Test Connection" button validates key works
- [x] Chat interface checks for configured provider before allowing agent invocation
- [x] Keys are never sent to the client (server-side only)

---

## Affected Design Documents

- [Web Chat Interface](../../../design/core/features/web-chat-interface.md)
- [Agent Runtime](../../../design/core/features/agent-runtime.md)

---

## Linked ADRs

- ADR-011: Web API Architecture

---

## Dependencies

- None

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create/modify:
- `packages/web/src/app/settings/page.tsx` — Settings page UI
- `packages/web/src/components/settings/api-key-form.tsx` — Key input form
- `packages/web/src/server/routers/settings.ts` — tRPC router for settings
- `packages/core/src/config/` — Config loader (or add to existing)
- `.choragen/config.json` — Config file schema

Config file structure:
```json
{
  "providers": {
    "anthropic": { "apiKey": "sk-ant-..." },
    "openai": { "apiKey": "sk-..." },
    "google": { "apiKey": "..." },
    "ollama": { "baseUrl": "http://localhost:11434" }
  }
}
```

Security considerations:
- Config file should be in `.gitignore`
- Never return actual key values to client, only "configured" boolean
- Server-side validation only

---

## Completion Notes

Implemented via CHAIN-063-api-key-settings (5 tasks):

**Files created:**
- `packages/core/src/config/provider-config.ts` — Config loader with Zod validation, env var precedence
- `packages/web/src/server/routers/settings.ts` — tRPC router (getProviders, updateApiKey, testConnection)
- `packages/web/src/app/settings/page.tsx` — Settings page UI
- `packages/web/src/components/settings/provider-card.tsx` — Provider status cards
- `packages/web/src/components/settings/api-key-form.tsx` — API key form with optimistic updates
- `packages/web/src/hooks/use-provider-status.ts` — Cached provider status hook
- `packages/web/src/components/chat/provider-required-banner.tsx` — Provider required banner

**Files modified:**
- `packages/web/src/components/chat/chat-input.tsx` — Provider gating
- `packages/web/src/components/chat/new-workflow-view.tsx` — Provider gating
- `packages/web/src/server/routers/index.ts` — Added settings router
- `packages/core/src/index.ts` — Exported config module

**Tests added:**
- `packages/core/src/config/__tests__/provider-config.test.ts`
- `packages/web/src/__tests__/routers/settings.test.ts`
- `packages/web/src/__tests__/components/chat/provider-status.test.tsx`

**Verification:**
- Web package builds successfully
- 288 tests pass
- All 9 acceptance criteria verified
