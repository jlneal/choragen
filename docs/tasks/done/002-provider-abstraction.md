# Task: Create Provider Abstraction

**Chain**: CR-20251214-001  
**Task**: 002  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Create a provider abstraction for fetching available models from LLM APIs (Anthropic, OpenAI, Ollama).

---

## Context

The system needs to dynamically fetch available models from connected providers. This enables:
- Populating model selector dropdowns
- Validating model references
- Supporting multiple providers simultaneously

Initial providers: Anthropic, OpenAI. Ollama can be added later.

---

## Expected Files

- `packages/core/src/providers/types.ts` — Provider interface definitions
- `packages/core/src/providers/anthropic.ts` — Anthropic provider implementation
- `packages/core/src/providers/openai.ts` — OpenAI provider implementation
- `packages/core/src/providers/index.ts` — Provider registry and exports
- `packages/core/src/index.ts` — Export provider types

---

## Acceptance Criteria

- [x] `ModelProvider` interface with `listModels(): Promise<ModelInfo[]>` method
- [x] `ModelInfo` type with `id`, `name`, `provider`, `capabilities` fields
- [x] `AnthropicProvider` implementation using `ANTHROPIC_API_KEY` env var
- [x] `OpenAIProvider` implementation using `OPENAI_API_KEY` env var
- [x] `ProviderRegistry` for managing multiple providers
- [x] Graceful handling when API keys are not configured
- [x] Types exported from `@choragen/core`
- [x] `pnpm build` passes

---

## Constraints

- Use native fetch, no additional HTTP dependencies
- API keys from environment variables only (no config files yet)
- Cache model lists with reasonable TTL (5 minutes)

---

## Notes

Depends on Task 001 for `ModelReference` type.

Reference APIs:
- Anthropic: `GET https://api.anthropic.com/v1/models`
- OpenAI: `GET https://api.openai.com/v1/models`
