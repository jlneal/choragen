# Task: Create system prompt templates for specialized roles

**Chain**: CHAIN-069-specialized-agent-roles  
**Task**: 004-004-system-prompt-templates  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Update the prompt loader to use role-specific system prompts. The runtime should use the `systemPrompt` field from the role definition, falling back to the existing prompt loader for roles without custom prompts.

---

## Expected Files

- `packages/cli/src/runtime/prompt-loader.ts — Support role systemPrompt field`
- `.choragen/roles/prompts/ — Optional external prompt files (if prompts are too long for YAML)`

---

## File Scope

- `packages/cli/src/runtime/prompt-loader.ts`
- `.choragen/roles/**`

---

## Acceptance Criteria

- [ ] PromptLoader.load() accepts optional role with systemPrompt
- [ ] If role has systemPrompt field, use it as the base system prompt
- [ ] If role has no systemPrompt, fall back to existing prompt loading logic
- [ ] System prompt can reference {{toolSummaries}} placeholder for tool list injection
- [ ] System prompt can reference {{chainId}}, {{taskId}} placeholders
- [ ] Prompts defined in roles YAML work correctly
- [ ] External prompt file references (e.g., file:prompts/control.md) are supported (optional)

---

## Notes

The design doc shows system prompts inline in the role YAML. For longer prompts, consider supporting a `file:` prefix to load from external files in `.choragen/roles/prompts/`.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
