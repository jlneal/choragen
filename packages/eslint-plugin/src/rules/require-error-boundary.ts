/**
 * Rule: require-error-boundary
 *
 * Encourages error boundary usage with async components for resilient UI.
 *
 * Warns when:
 * - Component uses async/await (async server components)
 * - Component uses Suspense without error boundary wrapper
 *
 * ADR: ADR-002-governance-schema (code hygiene enforcement)
 */

import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Encourage error boundary usage with async components for resilient UI",
      category: "Code Hygiene",
      recommended: false,
    },
    messages: {
      asyncComponentNeedsErrorBoundary:
        "Async component should be wrapped in an error boundary:\n" +
        "  <ErrorBoundary fallback={<ErrorFallback />}>\n" +
        "    <{{componentName}} />\n" +
        "  </ErrorBoundary>",
      suspenseNeedsErrorBoundary:
        "Suspense should be wrapped in an error boundary to catch async errors",
    },
    schema: [
      {
        type: "object",
        properties: {
          checkSuspense: {
            type: "boolean",
            default: true,
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    const options = (context.options[0] as { checkSuspense?: boolean }) || {};
    const checkSuspense = options.checkSuspense !== false;

    // Skip test files and API routes (API routes are not React components)
    if (
      filename.includes(".test.") ||
      filename.includes("__tests__") ||
      filename.endsWith("route.ts") ||
      filename.includes("/generated/")
    ) {
      return {};
    }

    // Track if this file has async components
    let hasAsyncComponent = false;
    let componentName: string | null = null;

    return {
      // Check for async function components
      FunctionDeclaration(node: any) {
        if (node.async && node.id && /^[A-Z]/.test(node.id.name)) {
          hasAsyncComponent = true;
          componentName = node.id.name;
        }
      },

      // Check for async arrow function components
      VariableDeclarator(node: any) {
        if (
          node.id.type === "Identifier" &&
          /^[A-Z]/.test(node.id.name) &&
          node.init &&
          node.init.type === "ArrowFunctionExpression" &&
          node.init.async
        ) {
          hasAsyncComponent = true;
          componentName = node.id.name;
        }
      },

      // Check for Suspense usage
      JSXElement(node: any) {
        if (checkSuspense && node.openingElement.name.name === "Suspense") {
          // Check if Suspense is wrapped in ErrorBoundary
          let parent = node.parent;
          let hasErrorBoundary = false;

          while (parent) {
            if (
              parent.type === "JSXElement" &&
              parent.openingElement.name.name === "ErrorBoundary"
            ) {
              hasErrorBoundary = true;
              break;
            }
            parent = parent.parent;
          }

          if (!hasErrorBoundary) {
            context.report({
              node,
              messageId: "suspenseNeedsErrorBoundary",
            });
          }
        }
      },

      // At the end, warn if async component detected
      "Program:exit"() {
        if (hasAsyncComponent && componentName) {
          // This is informational - we can't easily detect if it's wrapped
          // in an error boundary at the usage site
          context.report({
            loc: { line: 1, column: 0 },
            messageId: "asyncComponentNeedsErrorBoundary",
            data: { componentName },
          });
        }
      },
    };
  },
};

export default rule;
