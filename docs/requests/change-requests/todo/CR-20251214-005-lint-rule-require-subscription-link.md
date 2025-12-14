# Change Request: ESLint Rule - require-subscription-link

**ID**: CR-20251214-005  
**Domain**: eslint-plugin  
**Status**: todo  
**Created**: 2025-12-14  
**Priority**: medium  
**Owner**: agent  

---

## Summary

Create an ESLint rule to ensure tRPC clients have subscription link configured when subscription procedures are used.

---

## Motivation

FR-20251213-001 documented a runtime error when using tRPC subscriptions:

```
Error: Subscriptions are unsupported by `httpLink` - use `httpSubscriptionLink` or `wsLink`
```

This error only appears at runtime when a component tries to use `.useSubscription()`. Catching this at lint time would prevent the runtime failure.

---

## Proposed Solution

Create `@choragen/require-subscription-link` ESLint rule that:

1. **Detects subscription usage** — `.useSubscription()` or `.subscribe()` calls on tRPC client
2. **Verifies link configuration** — Check that tRPC client setup includes `httpSubscriptionLink` or `wsLink`
3. **Cross-file analysis** — May need to track tRPC client configuration across files

### Configuration

```javascript
rules: {
  "@choragen/require-subscription-link": ["error", {
    clientConfigPath: "src/lib/trpc/provider.tsx",  // Where to check for link config
  }]
}
```

### Error Message

```
tRPC subscription used but client may not have subscription link configured.
Ensure 'httpSubscriptionLink' or 'wsLink' is included in tRPC client links.
See: src/lib/trpc/provider.tsx
```

---

## Acceptance Criteria

- [ ] Rule detects `.useSubscription()` calls on tRPC client
- [ ] Rule warns if subscription link may be missing
- [ ] Rule provides actionable error message
- [ ] Rule has comprehensive test coverage
- [ ] Rule is enabled in `@choragen/web` eslint config

---

## Implementation Notes

This is a challenging rule because:
1. tRPC client configuration is in a different file than subscription usage
2. Link configuration may be dynamic (splitLink, conditional)

Options:
1. **Heuristic check** — Warn on any subscription usage, suggest verifying config
2. **Cross-file analysis** — Parse client config file to verify links
3. **Comment annotation** — Allow `// @subscription-link-verified` to suppress

Recommend option 1 (heuristic) initially, with option 3 for suppression.

---

## Linked ADRs

- ADR-002-governance-schema (ESLint plugin architecture)
- ADR-011-web-api-architecture (tRPC configuration)

---

## Linked FRs

- FR-20251213-001 (tRPC Subscription Link Missing)

---

## Commits

[Added when work is committed]
