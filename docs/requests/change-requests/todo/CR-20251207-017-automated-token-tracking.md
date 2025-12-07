# Change Request: Automated Token Tracking

**ID**: CR-20251207-017  
**Domain**: metrics  
**Status**: todo  
**Created**: 2025-12-07  
**Owner**: agent  

---

## Summary

Automate token tracking by integrating with LLM API providers (OpenRouter, OpenAI, Anthropic) to capture actual token usage without manual entry.

## Motivation

Manual token tracking (CR-20251207-011) is tedious and often skipped. Automated tracking ensures:
- Accurate cost data
- Complete metrics coverage
- No friction for agents

## Proposed Approaches

### Option 1: API Log Integration

Pull token counts from provider dashboards/APIs after the fact.

```bash
choragen metrics:sync-tokens --provider openrouter --since 7d
```

### Option 2: Proxy/Middleware

Route API calls through a local proxy that logs tokens.

### Option 3: IDE Integration

If running in Windsurf/Cursor, read from their usage logs.

## Dependencies

- CR-20251207-011 (Pipeline Metrics) - base metrics system

## Out of Scope for Now

This is a placeholder for future work. Implementation details TBD based on:
- Which providers users commonly use
- API availability for usage data
- Privacy considerations

---

## Commits

[Populated by `choragen request:close`]
