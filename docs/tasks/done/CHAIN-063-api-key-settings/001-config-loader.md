# Task: Config Loader for Provider Keys

**Chain**: CHAIN-063-api-key-settings  
**Task**: 001-config-loader  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Create a config loader that reads provider API keys from `.choragen/config.json` and merges with environment variables (env vars take precedence).

---

## Context

The CR requires API keys to be stored in `.choragen/config.json` and loaded at server startup. Environment variables should override config file values for deployment flexibility.

---

## Expected Files

- `packages/core/src/config/provider-config.ts` — Config loader and types
- `packages/core/src/config/index.ts` — Export from config module

---

## Acceptance Criteria

- [ ] Define `ProviderConfig` type with providers: anthropic, openai, google, ollama
- [ ] `loadProviderConfig()` reads from `.choragen/config.json`
- [ ] Environment variables (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `OLLAMA_BASE_URL`) override config file
- [ ] Returns which providers are configured (boolean flags, not actual keys)
- [ ] Handles missing config file gracefully (returns empty config)
- [ ] Unit tests for config loading and env var override

---

## Constraints

- Config file path is relative to project root (`.choragen/config.json`)
- Never expose actual key values in return types meant for client consumption
- Use Zod for config validation

---

## Notes

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

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
