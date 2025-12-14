# Change Request: Model Selection for Workflow Stages

**ID**: CR-20251214-001  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-14  
**Owner**: agent  

---

## What

Add model selection capabilities to workflow stages. Each stage should have a configurable default model, and users should be able to switch models within a chat session. The system should fetch available models from connected provider APIs.

Key additions:
1. `ModelReference` type with `provider` and `model` fields
2. `defaultModel` field on `WorkflowStage` and `WorkflowTemplateStage`
3. `model` field on `WorkflowMessage` to track which model generated each response
4. Provider configuration for fetching available model lists
5. UI components for model selection in chat and template editor

---

## Why

Currently, workflow stages have no model configuration. Different stages have different needs:
- **Ideation/design** stages may benefit from creative models
- **Implementation** stages may need code-focused models
- **Review** stages could use reasoning-heavy models

Users should be able to:
1. Set sensible defaults per stage in workflow templates
2. Override the model at runtime within a chat session
3. See which model generated each message in the conversation history

---

## Scope

**In Scope**:
- Core type definitions (`ModelReference`, stage/message model fields)
- Provider abstraction for fetching model lists
- Workflow template schema updates
- WorkflowManager updates to track model per message
- UI model selector in chat interface
- UI model configuration in template editor

**Out of Scope**:
- Credential management UI (use env vars initially)
- Model cost tracking/budgeting
- Model performance benchmarking
- Fine-tuned model support

---

## Affected Design Documents

- `docs/design/core/features/workflow-orchestration.md` — Core workflow types need model fields
- `docs/design/core/features/workflow-template-editor.md` — Template editor needs model config UI

---

## Linked ADRs

- ADR-011: Workflow Orchestration (will need update for model fields)

---

## Commits

_Pending commit_

---

## Implementation Notes

### Phase 1: Core Types (impl)
Add `ModelReference` type and update `WorkflowStage`, `WorkflowTemplateStage`, `WorkflowMessage` in `@choragen/core`.

### Phase 2: Provider Abstraction (impl)
Create provider interface for fetching available models. Initial support for Anthropic and OpenAI APIs.

### Phase 3: Manager Updates (impl)
Update `WorkflowManager` to accept model parameter when adding messages and pass through to LLM calls.

### Phase 4: UI - Chat Model Selector (impl)
Add model selector dropdown to chat interface. Show current model, allow switching.

### Phase 5: UI - Template Model Config (impl)
Add model configuration to workflow template editor for setting stage defaults.

---

## Completion Notes

**Completed**: 2025-12-14

All 5 phases implemented:

1. **Core Types** — `ModelReference` already existed; confirmed `defaultModel` on stages and `model` on messages
2. **Provider Abstraction** — `ProviderRegistry`, `AnthropicProvider`, `OpenAIProvider` with caching (5min TTL)
3. **Manager Updates** — `addMessage` accepts `model`, `getCurrentModel()` returns active model for stage
4. **UI Chat Selector** — Model dropdown in chat input, model badge on messages, provider grouping
5. **UI Template Config** — `StageModelConfig` component in stage editor, "No default" option, unavailable model detection

**Key Files**:
- `packages/core/src/providers/` — Provider abstraction
- `packages/core/src/workflow/manager.ts` — Model tracking
- `packages/web/src/components/chat/model-selector.tsx` — Chat UI
- `packages/web/src/components/workflows/stage-model-config.tsx` — Template UI
- `packages/web/src/server/routers/providers.ts` — tRPC endpoint
