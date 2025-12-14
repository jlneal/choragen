/**
 * Rule: require-subscription-link
 *
 * Warns when tRPC subscriptions are used without confirming the subscription
 * link is configured. A file-level suppression is allowed via the comment:
 *   // @subscription-link-verified
 *
 * ADR: ADR-002-governance-schema
 * CR: CR-20251214-005
 */

import type { Rule } from "eslint";

const SUBSCRIPTION_METHODS = new Set(["useSubscription", "subscribe"]);
const SUPPRESSION_TAG = "@subscription-link-verified";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Warn when tRPC subscriptions are used without confirming subscription link configuration",
      category: "tRPC",
      recommended: true,
    },
    schema: [],
    messages: {
      verifySubscriptionLink:
        "tRPC subscription '{{method}}' detected. Verify subscription link configuration or add '// @subscription-link-verified' once confirmed.",
    },
  },

  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();
    const hasSuppression = sourceCode
      .getAllComments()
      .some((comment) => comment.value.includes(SUPPRESSION_TAG));

    if (hasSuppression) {
      return {};
    }

    const reportSubscription = (node: any, method: string) => {
      context.report({
        node,
        messageId: "verifySubscriptionLink",
        data: { method },
      });
    };

    return {
      CallExpression(node: any) {
        const callee = node.callee?.type === "ChainExpression"
          ? (node.callee as any).expression
          : node.callee;

        if (!callee || callee.type !== "MemberExpression") {
          return;
        }

        if (
          callee.property?.type === "Identifier" &&
          SUBSCRIPTION_METHODS.has(callee.property.name)
        ) {
          reportSubscription(callee.property, callee.property.name);
        }
      },
    };
  },
};

export default rule;
