# Task: Settings Page UI

**Chain**: CHAIN-063-api-key-settings  
**Task**: 003-settings-page-ui  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Create the `/settings` page with a form for configuring LLM provider API keys.

---

## Context

Users need a UI to enter and manage their API keys. The page should show which providers are configured and allow updating keys without revealing existing values.

---

## Expected Files

- `packages/web/src/app/settings/page.tsx` — Settings page
- `packages/web/src/components/settings/api-key-form.tsx` — API key configuration form
- `packages/web/src/components/settings/provider-card.tsx` — Individual provider config card

---

## Acceptance Criteria

- [ ] `/settings` route renders settings page
- [ ] Shows cards for each provider: Anthropic, OpenAI, Google, Ollama
- [ ] Each card shows configured/not configured status (green/gray indicator)
- [ ] Password input field for API key (masked)
- [ ] "Save" button to update key
- [ ] "Test Connection" button with loading state and success/error feedback
- [ ] Ollama card has base URL field instead of API key
- [ ] Navigation link to settings in sidebar/header
- [ ] Mobile-responsive layout

---

## Constraints

- Follow existing UI patterns (shadcn/ui components, Tailwind)
- Never display actual key values, even masked
- Use optimistic updates with error rollback

---

## Notes

UI mockup:
```
┌─────────────────────────────────────────────────────────────┐
│  ⚙️ Settings                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  LLM Provider Configuration                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🟢 Anthropic                          [Configured]  │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ API Key: ••••••••••••••••                   │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │  [Save] [Test Connection]                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ⚪ OpenAI                          [Not Configured] │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ API Key:                                    │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │  [Save] [Test Connection]                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
