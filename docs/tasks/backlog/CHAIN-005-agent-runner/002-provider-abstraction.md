# Task: Implement provider abstraction (Anthropic + OpenAI)

**Chain**: CHAIN-005-agent-runner  
**Task**: 002-provider-abstraction  
**Status**: backlog  
**Created**: 2025-12-06

---

## Objective

Create a unified interface for LLM providers (Anthropic and OpenAI) that normalizes tool calling and message formats.

---

## Expected Files

Create:
- `packages/agent-runner/src/providers/types.ts` - Shared types
- `packages/agent-runner/src/providers/anthropic.ts` - Anthropic client
- `packages/agent-runner/src/providers/openai.ts` - OpenAI client
- `packages/agent-runner/src/providers/index.ts` - Factory function

---

## Acceptance Criteria

- [ ] `LLMClient` interface defined
- [ ] `AnthropicClient` implements interface
- [ ] `OpenAIClient` implements interface
- [ ] `getClient(provider, apiKey)` factory function
- [ ] Tool definitions normalized across providers
- [ ] Message format normalized
- [ ] `pnpm build` passes

---

## Notes

**types.ts**:
```typescript
// ADR: ADR-004-agent-runner

export type Provider = "anthropic" | "openai";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface Message {
  role: "user" | "assistant" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface CompletionRequest {
  model: string;
  system: string;
  messages: Message[];
  tools: ToolDefinition[];
}

export interface CompletionResponse {
  content: string;
  toolCalls: ToolCall[];
  stopReason: "end_turn" | "tool_use" | "max_tokens";
}

export interface LLMClient {
  complete(request: CompletionRequest): Promise<CompletionResponse>;
}
```

**anthropic.ts**: Wrap `@anthropic-ai/sdk`, convert tool format
**openai.ts**: Wrap `openai`, convert tool format

**Factory**:
```typescript
export function getClient(provider: Provider, apiKey: string): LLMClient {
  if (provider === "anthropic") {
    return new AnthropicClient(apiKey);
  }
  return new OpenAIClient(apiKey);
}
```

**Verification**:
```bash
pnpm build
```
