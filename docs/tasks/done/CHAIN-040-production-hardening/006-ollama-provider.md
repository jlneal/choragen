# Task: Implement Ollama Provider

**ID**: 006-ollama-provider  
**Chain**: CHAIN-040-production-hardening  
**Status**: done  
**Type**: impl  
**CR**: CR-20251207-028  

---

## Objective

Add support for local LLM inference via Ollama, enabling offline/private agent sessions.

---

## Acceptance Criteria

- [ ] Create `packages/cli/src/runtime/providers/ollama.ts`
- [ ] Implement `LLMProvider` interface for Ollama
- [ ] Support `--provider=ollama` flag
- [ ] Configure via `OLLAMA_HOST` env var (default: http://localhost:11434)
- [ ] Configure model via `OLLAMA_MODEL` env var (default: llama2)
- [ ] Handle models without native tool support (prompt-based fallback)
- [ ] Graceful error if Ollama not running
- [ ] Register provider in provider factory
- [ ] Add unit tests for Ollama provider

---

## Implementation Notes

### Ollama API

```typescript
// POST http://localhost:11434/api/chat
interface OllamaChatRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  tools?: Array<OllamaTool>;  // Only some models support this
}

interface OllamaChatResponse {
  message: { role: string; content: string; tool_calls?: ToolCall[] };
  done: boolean;
  total_duration?: number;
  eval_count?: number;  // Output tokens
  prompt_eval_count?: number;  // Input tokens
}
```

### Tool Support Detection

```typescript
// Models with native tool support
const TOOL_CAPABLE_MODELS = new Set([
  'llama3.1', 'llama3.2', 'mistral', 'mixtral', 'qwen2.5'
]);

// For other models, use prompt-based tool calling
function formatToolsAsPrompt(tools: Tool[]): string {
  return `Available tools:\n${tools.map(t => 
    `- ${t.name}: ${t.description}\n  Parameters: ${JSON.stringify(t.inputSchema)}`
  ).join('\n')}`;
}
```

### Environment Variables

```bash
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

---

## Files to Create/Modify

- `packages/cli/src/runtime/providers/ollama.ts` (create)
- `packages/cli/src/runtime/providers/index.ts` (modify - register provider)
- `packages/cli/src/commands/agent/start.ts` (modify - add provider option)
- `packages/cli/src/__tests__/ollama-provider.test.ts` (create)
