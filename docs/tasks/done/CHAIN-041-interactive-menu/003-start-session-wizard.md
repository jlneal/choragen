# Task: Implement Start Session Wizard

**Chain**: CHAIN-041-interactive-menu  
**Task**: 003-start-session-wizard  
**Status**: todo  
**Type**: impl  
**Created**: 2025-12-08

---

## Objective

Implement the "Start New Session" wizard that guides users through configuring and starting an agent session.

---

## Context

The main menu is complete. This task implements the most complex menu flow - the session configuration wizard that replaces the need to remember CLI flags.

---

## Expected Files

- `packages/cli/src/menu/start-session.ts` (wizard implementation)
- `packages/cli/src/menu/prompts.ts` (reusable prompt helpers)
- `packages/cli/src/__tests__/menu/start-session.test.ts`

---

## Acceptance Criteria

- [ ] Select role: impl / control (radio buttons)
- [ ] Select provider: anthropic / openai / gemini / ollama
- [ ] Select or enter model name (with provider-specific defaults)
- [ ] Set token limit (optional, with sensible default shown)
- [ ] Set cost limit (optional, with sensible default shown)
- [ ] Toggle approval prompts (checkbox)
- [ ] Enter task description (multi-line text input)
- [ ] Confirmation step showing all selections before starting
- [ ] Cancel at any step returns to main menu
- [ ] On confirm, calls existing `runAgentStart()` with constructed options
- [ ] Unit tests for wizard flow
- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes

---

## Constraints

- Reuse existing runtime types (`AgentRole`, `ProviderName`, etc.)
- Wizard should validate inputs before proceeding
- Provider selection should check for API key availability and warn if missing

---

## Notes

Reference the CR mockup for the wizard layout:

```
┌─ Start New Session ─────────────────────┐
│                                         │
│  Role:     ○ impl  ● control            │
│  Provider: ● anthropic ○ openai ○ ollama│
│  Model:    claude-3-5-sonnet-20241022   │
│                                         │
│  Token Limit: 100000 (optional)         │
│  Cost Limit:  $5.00 (optional)          │
│                                         │
│  ☐ Require approval for sensitive ops   │
│                                         │
│  Task Description:                      │
│  ┌─────────────────────────────────────┐│
│  │ Implement the retry module with    ││
│  │ exponential backoff...             ││
│  └─────────────────────────────────────┘│
│                                         │
│  [ Start Session ]  [ Cancel ]          │
└─────────────────────────────────────────┘
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
