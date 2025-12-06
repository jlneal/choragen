/**
 * Rule: no-as-unknown
 *
 * Disallows casting to `unknown` which bypasses type safety.
 * Use explicit type guards, generics, or the unsafeCast utility instead.
 *
 * Blocked:
 *   const x = value as unknown as SomeType;
 *
 * Allowed:
 *   const x = unsafeCast<SomeType>(value);  // Explicit, searchable
 *   const x = isType(value) ? value : fallback;  // Type guard
 *
 * ADR: ADR-002-governance-schema (code hygiene enforcement)
 */

import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow casting to unknown",
      category: "Code Hygiene",
      recommended: true,
    },
    schema: [],
    messages: {
      noAsUnknown:
        'Avoid using "as unknown" casts. Use unsafeCast<T>() from @choragen/test-utils for test mocks, or explicit type guards for production code.',
    },
  },

  create(context) {
    function containsUnknownKeyword(typeAnnotation: any): boolean {
      if (!typeAnnotation) {
        return false;
      }

      if (typeAnnotation.type === "TSParenthesizedType") {
        return containsUnknownKeyword(typeAnnotation.typeAnnotation);
      }

      return typeAnnotation.type === "TSUnknownKeyword";
    }

    function checkType(node: any, typeAnnotation: any): void {
      if (containsUnknownKeyword(typeAnnotation)) {
        context.report({ node, messageId: "noAsUnknown" });
      }
    }

    return {
      TSAsExpression(node: any) {
        checkType(node, node.typeAnnotation);
      },
      TSTypeAssertion(node: any) {
        checkType(node, node.typeAnnotation);
      },
    };
  },
};

export default rule;
