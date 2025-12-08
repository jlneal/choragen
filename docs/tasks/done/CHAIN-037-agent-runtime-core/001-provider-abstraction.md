# Task: LLM Provider Abstraction

**Chain**: CHAIN-037-agent-runtime-core  
**Task**: 001-provider-abstraction  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-08

---

## Objective

Create the LLM provider abstraction layer that normalizes differences between Anthropic, OpenAI, and Gemini APIs.

---

## Context

The agent runtime needs to call LLM APIs directly. Each provider has different:
- Authentication methods
- Message formats
- Tool call schemas
- Streaming response formats

This task creates a unified interface that the agentic loop can use without caring about provider specifics.

**Reference**: ADR-010 Section 4 (Provider Abstraction Layer)

---

## Expected Files

Create:
- `packages/cli/src/runtime/providers/types.ts` — Provider interface and types
- `packages/cli/src/runtime/providers/anthropic.ts` — Anthropic implementation
- `packages/cli/src/runtime/providers/openai.ts` — OpenAI implementation
- `packages/cli/src/runtime/providers/gemini.ts` — Gemini implementation
- `packages/cli/src/runtime/providers/index.ts` — Factory and exports

---

## Acceptance Criteria

- [ ] `LLMProvider` interface defined with `chat()` method
- [ ] `Message`, `Tool`, `ToolCall`, `StreamChunk` types defined
- [ ] `AnthropicProvider` implements interface using `@anthropic-ai/sdk`
- [ ] `OpenAIProvider` implements interface using `openai` package
- [ ] `GeminiProvider` implements interface using `@google/generative-ai`
- [ ] `createProvider(name, config)` factory function works
- [ ] Provider selection via `CHORAGEN_PROVIDER` env var
- [ ] API key read from `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`
- [ ] Unit tests for each provider (can mock API calls)
- [ ] TypeScript compiles without errors

---

## Constraints

- Do NOT implement streaming yet — return complete responses
- Do NOT implement retry/backoff yet — that's Phase 4
- Keep implementations minimal — just enough to prove the interface works

---

## Notes

**Provider Interface** (from ADR-010):
```typescript
interface LLMProvider {
  chat(messages: Message[], tools: Tool[]): Promise<ChatResponse>;
}

interface ChatResponse {
  content: string;
  toolCalls: ToolCall[];
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens';
  usage: { inputTokens: number; outputTokens: number };
}
```

**Dependencies to add to packages/cli/package.json**:
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.52.0",
    "openai": "^4.77.0",
    "@google/generative-ai": "^0.21.0"
  }
}
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
