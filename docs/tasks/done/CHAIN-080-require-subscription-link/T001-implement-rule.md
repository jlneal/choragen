# Task: Implement require-subscription-link ESLint Rule

**Chain**: CHAIN-080  
**Task**: T001  
**Type**: impl  
**Status**: done  
**Request**: CR-20251214-005  

---

## Objective

Create an ESLint rule `require-subscription-link` that warns when tRPC subscription methods (`.useSubscription()` or `.subscribe()`) are used, suggesting developers verify their tRPC client has a subscription-capable link configured.

---

## Context

FR-20251213-001 documented a runtime error when using tRPC subscriptions without proper link configuration:

```
Error: Subscriptions are unsupported by `httpLink` - use `httpSubscriptionLink` or `wsLink`
```

This error only appears at runtime. Catching it at lint time prevents the runtime failure.

**Approach**: Use a heuristic warning (Option 1 from CR). The rule warns on any subscription usage and suggests verifying configuration. This avoids complex cross-file analysis while still catching the issue early.

---

## Acceptance Criteria

1. **Detect subscription calls**: Rule reports on `.useSubscription()` and `.subscribe()` calls on tRPC client objects
2. **Actionable error message**: Message tells developer to verify `httpSubscriptionLink` or `wsLink` is configured
3. **Suppression via comment**: Allow `// @subscription-link-verified` comment to suppress warning
4. **Comprehensive tests**: Unit tests covering detection, suppression, and edge cases
5. **Plugin integration**: Rule exported from `@choragen/eslint-plugin` and added to configs

---

## Implementation Guide

### 1. Create Rule File

Create `packages/eslint-plugin/src/rules/require-subscription-link.ts`:

```typescript
/**
 * Rule: require-subscription-link
 *
 * Warns when tRPC subscription methods are used, suggesting verification
 * that the client has subscription-capable link configured.
 *
 * ADR: ADR-002-governance-schema
 * CR: CR-20251214-005
 */

import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Warn when tRPC subscriptions are used without verified link configuration",
      category: "Code Hygiene",
      recommended: true,
    },
    schema: [],
    messages: {
      subscriptionUsed:
        "tRPC subscription used. Ensure 'httpSubscriptionLink' or 'wsLink' is configured in your tRPC client. " +
        "Add '// @subscription-link-verified' comment to suppress this warning.",
    },
  },

  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();
    
    // Check if file has suppression comment
    const comments = sourceCode.getAllComments();
    const hasSuppression = comments.some(
      (comment) => comment.value.includes("@subscription-link-verified")
    );
    
    if (hasSuppression) {
      return {};
    }

    return {
      CallExpression(node: any) {
        // Check for .useSubscription() or .subscribe() calls
        if (node.callee.type !== "MemberExpression") return;
        
        const property = node.callee.property;
        if (property.type !== "Identifier") return;
        
        if (property.name === "useSubscription" || property.name === "subscribe") {
          context.report({
            node,
            messageId: "subscriptionUsed",
          });
        }
      },
    };
  },
};

export default rule;
```

### 2. Register Rule in Index

Update `packages/eslint-plugin/src/rules/index.ts`:
- Add import for `require-subscription-link`
- Add to rules object under "Code hygiene rules" section

### 3. Update Plugin Configs

Update `packages/eslint-plugin/src/index.ts`:
- Add `"@choragen/require-subscription-link": "warn"` to recommended config
- Add `"@choragen/require-subscription-link": "error"` to strict config

### 4. Create Tests

Create `packages/eslint-plugin/src/rules/__tests__/require-subscription-link.test.ts`:

Test cases to cover:
- **Valid**: Code without subscription calls
- **Valid**: Code with suppression comment `// @subscription-link-verified`
- **Invalid**: `.useSubscription()` call without suppression
- **Invalid**: `.subscribe()` call without suppression
- **Valid**: Regular `.subscribe()` on non-tRPC objects (if distinguishable)

---

## Files to Create

- `packages/eslint-plugin/src/rules/require-subscription-link.ts`
- `packages/eslint-plugin/src/rules/__tests__/require-subscription-link.test.ts`

## Files to Modify

- `packages/eslint-plugin/src/rules/index.ts` — Add import and export
- `packages/eslint-plugin/src/index.ts` — Add to configs

---

## Verification

```bash
# Build and typecheck
pnpm --filter @choragen/eslint-plugin build
pnpm --filter @choragen/eslint-plugin typecheck

# Run tests
pnpm --filter @choragen/eslint-plugin test

# Lint check
pnpm lint
```

---

## Notes

- The rule uses a heuristic approach (warns on all subscription usage) rather than cross-file analysis
- This may produce false positives in projects that do have proper link configuration
- The suppression comment provides an escape hatch for verified configurations
- Future enhancement could add `clientConfigPath` option for cross-file verification
