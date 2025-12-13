# ADR-014: Specialized Agent Roles

**Status**: doing  
**Created**: 2025-12-12  
**Linked CR/FR**: CR-20251212-001  
**Linked Design Docs**: docs/design/core/features/specialized-agent-roles.md, docs/design/core/features/role-based-tool-access.md  

---

## Context

The current role system defines tool access via `RoleManager` and `.choragen/roles/index.yaml`, but all agents use the same model configuration and system prompts regardless of their function. This limits:

1. **Optimization** — Cannot tune temperature for creativity (ideation) vs. precision (commit)
2. **Specialization** — No behavioral differentiation between agent types
3. **Context management** — No guidance on keeping agent focus narrow
4. **Cost control** — Cannot assign different models to different roles (e.g., cheaper models for simple tasks)

The design doc (`docs/design/core/features/specialized-agent-roles.md`) defines eight specialized roles with distinct purposes, model configurations, and system prompts.

---

## Decision

### 1. Extend Role Interface with Model Configuration

Add `model` and `systemPrompt` fields to the `Role` interface:

```typescript
interface Role {
  id: string;
  name: string;
  description?: string;
  toolIds: string[];
  model?: RoleModelConfig;
  systemPrompt?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RoleModelConfig {
  provider: string;      // anthropic, openai, gemini, ollama
  model: string;         // claude-sonnet-4-20250514, gpt-4o, etc.
  temperature: number;   // 0.0 - 1.0
  maxTokens?: number;
}
```

### 2. Create roles/index.yaml with Eight Specialized Roles

Define all eight roles in `.choragen/roles/index.yaml`:

| Role | Temperature | Purpose |
|------|-------------|---------|
| control | 0.3 | Human interface for process control |
| ideation | 0.7 | Explore and refine ideas |
| design | 0.4 | Create design artifacts |
| orchestration | 0.2 | Manage implementation chains |
| implementation | 0.3 | Execute implementation tasks |
| review | 0.3 | Review completed work |
| commit | 0.1 | Handle version control |
| researcher | 0.5 | Read-only exploration |

### 3. Agent Runtime Resolves Model Config from Role

The agentic loop will:
1. Resolve role by ID via `RoleManager`
2. Extract model configuration from role definition
3. Override provider defaults with role-specific settings
4. Use role's system prompt template

### 4. System Prompts as External Files (Optional)

System prompts can be:
- Inline in `roles/index.yaml` (simple cases)
- External files in `.choragen/roles/prompts/` (complex prompts)

The `systemPrompt` field can be either the prompt text or a file reference.

### 5. Backward Compatibility

- Roles without `model` config use provider defaults
- Roles without `systemPrompt` use the existing prompt loader
- Existing `control`/`impl` role mapping continues to work

---

## Consequences

**Positive**:
- Each role can be tuned for its specific purpose (temperature, model)
- Cost optimization by using cheaper models for simpler roles
- Clear behavioral contracts via system prompts
- Extensible — users can define custom roles with custom configs

**Negative**:
- More configuration to manage
- Potential for misconfiguration (wrong model for role)
- System prompts need maintenance as capabilities change

**Mitigations**:
- Provide sensible defaults for all eight roles
- Validate model config on load (warn if model unavailable)
- Document system prompt best practices

---

## Alternatives Considered

### Alternative 1: Hardcode Model Config per Role in Code

Define model configurations in TypeScript constants rather than YAML.

**Rejected because**: Reduces flexibility. Users cannot customize without code changes. Inconsistent with the configurable role system already in place.

### Alternative 2: Separate Model Config from Role Definition

Store model configs in a separate `models.yaml` file, referenced by role.

**Rejected because**: Adds indirection without clear benefit. Role and its model config are tightly coupled — keeping them together is simpler.

### Alternative 3: Temperature-Only Configuration

Only add temperature to roles, not full model config.

**Rejected because**: Limits cost optimization potential. Different roles may benefit from different models (e.g., smaller model for commit agent).

---

## Implementation

[Added when moved to done/]

- `packages/core/src/roles/types.ts` — Extended Role interface
- `packages/core/src/roles/manager.ts` — Model config resolution
- `packages/cli/src/runtime/loop.ts` — Use role model config
- `.choragen/roles/index.yaml` — Eight specialized role definitions
- `.choragen/roles/prompts/` — System prompt templates
