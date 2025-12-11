# Task: Integration Verification

**Chain**: CHAIN-063-api-key-settings  
**Task**: 005-integration-verification  
**Status**: done  
**Type**: control  
**Created**: 2025-12-11

---

## Objective

Verify all acceptance criteria from CR-20251211-001 are met and the feature works end-to-end.

---

## Context

Final verification task to ensure all pieces integrate correctly before closing the CR.

---

## Expected Files

None (verification only)

---

## Acceptance Criteria

- [ ] `/settings` route exists with API key configuration UI
- [ ] Can enter API keys for Anthropic, OpenAI, Google, Ollama
- [ ] Keys are saved to `.choragen/config.json`
- [ ] Server loads keys from config file on startup
- [ ] Environment variables override config file values
- [ ] Settings page shows which providers are configured (without revealing keys)
- [ ] "Test Connection" button validates key works
- [ ] Chat interface checks for configured provider before allowing agent invocation
- [ ] Keys are never sent to the client (server-side only)

---

## Constraints

- Must test with actual API key (can use Ollama for local testing)
- Verify no key leakage in network tab

---

## Notes

Verification steps:
1. Start web server without any env vars or config
2. Navigate to `/settings` — all providers should show "Not Configured"
3. Enter Ollama base URL, save, test connection
4. Verify `.choragen/config.json` contains the config
5. Navigate to chat — should now allow input
6. Restart server — config should persist
7. Set `OLLAMA_BASE_URL` env var to different value — env should take precedence

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
