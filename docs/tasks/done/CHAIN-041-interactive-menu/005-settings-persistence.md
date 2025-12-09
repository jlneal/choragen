# Task: Implement Settings Persistence

**Chain**: CHAIN-041-interactive-menu  
**Task**: 005-settings-persistence  
**Status**: todo  
**Type**: impl  
**Created**: 2025-12-08

---

## Objective

Implement the "Settings" menu option with persistent configuration storage.

---

## Context

Users should be able to set default values for provider, model, token limits, etc. that persist across sessions. These defaults should be loaded when launching the menu and can be overridden per-session.

---

## Expected Files

- `packages/cli/src/menu/settings.ts` (settings menu)
- `packages/cli/src/config/user-config.ts` (config persistence)
- `packages/cli/src/config/types.ts` (config types)
- `packages/cli/src/__tests__/menu/settings.test.ts`
- `packages/cli/src/__tests__/config/user-config.test.ts`

---

## Acceptance Criteria

- [ ] Settings menu with options: Default Provider, Default Model, Token Limit, Cost Limit, Approval Settings, Back
- [ ] Settings saved to `.choragen/config.yaml`
- [ ] Settings loaded on menu launch
- [ ] Start Session wizard pre-fills with saved defaults
- [ ] Each setting can be individually edited
- [ ] "Reset to Defaults" option
- [ ] Settings file created if it doesn't exist
- [ ] Invalid settings file handled gracefully (reset to defaults with warning)
- [ ] Unit tests for config persistence
- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes

---

## Constraints

- Use YAML format for config file (consistent with existing `.choragen/config.yaml`)
- Config schema should be versioned for future migrations
- Don't store sensitive data (API keys) in config file

---

## Notes

Example config structure:

```yaml
version: 1
defaults:
  provider: anthropic
  model: claude-3-5-sonnet-20241022
  tokenLimit: 100000
  costLimit: 5.00
  requireApproval: false
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
