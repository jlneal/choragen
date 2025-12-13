# Task: Update web UI to display role model configuration

**Chain**: CHAIN-069-specialized-agent-roles  
**Task**: 005-005-web-ui-role-config  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Update the web UI role editor to display and allow editing of model configuration fields (provider, model, temperature) for each role.

---

## Expected Files

- `packages/web/src/app/roles/[id]/page.tsx — Role editor with model config fields`
- `packages/web/src/components/roles/RoleModelConfigForm.tsx — Model config form component`
- `packages/web/src/server/routers/role.ts — tRPC router updates for model config`

---

## File Scope

- `packages/web/src/app/roles/**`
- `packages/web/src/components/roles/**`
- `packages/web/src/server/routers/role.ts`

---

## Acceptance Criteria

- [ ] Role editor page displays model configuration section
- [ ] Provider dropdown with options: anthropic, openai, gemini, ollama
- [ ] Model text input with provider-specific suggestions
- [ ] Temperature slider (0.0 - 1.0) with current value display
- [ ] Optional maxTokens number input
- [ ] System prompt textarea (collapsible for long prompts)
- [ ] Save updates model config to roles YAML via tRPC
- [ ] Role list page shows temperature badge for each role
- [ ] Validation: temperature must be 0.0-1.0, provider must be valid

---

## Notes

Depends on task 001 (Role interface) and task 002 (roles YAML). The existing role editor at `/roles/[id]` needs to be extended with the new fields.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
