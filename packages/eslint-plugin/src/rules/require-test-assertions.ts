/**
 * Rule: require-test-assertions
 *
 * Ensures that test blocks contain at least one assertion.
 * Tests without assertions are meaningless and should be flagged.
 *
 * Blocked:
 *   it('should work', () => {});
 *   test('does something', () => { const x = 1; });
 *
 * Allowed:
 *   it('should work', () => { expect(result).toBe(true); });
 *   test('does something', () => { expect(x).toBeDefined(); });
 *
 * ADR: ADR-002-governance-schema
 */

import type { Rule } from "eslint";

/**
 * Check if a node contains an expect() call
 */
function containsExpect(node: any): boolean {
  if (!node) return false;

  // Direct expect() call
  if (
    node.type === "CallExpression" &&
    node.callee?.type === "Identifier" &&
    node.callee.name === "expect"
  ) {
    return true;
  }

  // Check for expect().matcher() pattern
  if (
    node.type === "CallExpression" &&
    node.callee?.type === "MemberExpression" &&
    node.callee.object?.type === "CallExpression" &&
    node.callee.object.callee?.type === "Identifier" &&
    node.callee.object.callee.name === "expect"
  ) {
    return true;
  }

  // Recursively check child nodes
  for (const key of Object.keys(node)) {
    if (key === "parent" || key === "range" || key === "loc") continue;

    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item && typeof item === "object" && containsExpect(item)) {
          return true;
        }
      }
    } else if (child && typeof child === "object") {
      if (containsExpect(child)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if a function body is empty or only contains setup (no assertions)
 */
function isEmptyOrSetupOnly(body: any): { empty: boolean; setupOnly: boolean } {
  if (!body) return { empty: true, setupOnly: false };

  // BlockStatement with no statements
  if (body.type === "BlockStatement") {
    if (body.body.length === 0) {
      return { empty: true, setupOnly: false };
    }

    // Check if any statement contains expect()
    const hasExpect = containsExpect(body);
    if (!hasExpect) {
      return { empty: false, setupOnly: true };
    }
  }

  // Arrow function with expression body (no block)
  if (body.type !== "BlockStatement") {
    // Single expression - check if it's an expect
    const hasExpect = containsExpect(body);
    if (!hasExpect) {
      return { empty: false, setupOnly: true };
    }
  }

  return { empty: false, setupOnly: false };
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require test blocks to have at least one assertion",
      category: "Test Quality",
      recommended: true,
    },
    messages: {
      emptyTest:
        "Empty test block. Add assertions to verify behavior, or remove the test.",
      noAssertions:
        "Test block has no assertions. Add expect() calls to verify behavior.",
    },
    schema: [],
  },

  create(context) {
    const filename = context.filename || context.getFilename();

    // Only check test files
    const isTestFile =
      filename.endsWith(".test.ts") ||
      filename.endsWith(".test.tsx") ||
      filename.endsWith(".test.js") ||
      filename.endsWith(".test.mjs") ||
      filename.endsWith(".spec.ts") ||
      filename.endsWith(".spec.tsx") ||
      filename.endsWith(".spec.js") ||
      filename.endsWith(".spec.mjs");

    if (!isTestFile) {
      return {};
    }

    return {
      CallExpression(node: any) {
        // Look for it(), test(), it.each(), test.each() patterns
        const callee = node.callee;
        if (!callee) return;

        let isTestCall = false;

        // it('...', fn) or test('...', fn)
        if (
          callee.type === "Identifier" &&
          (callee.name === "it" || callee.name === "test")
        ) {
          isTestCall = true;
        }

        // it.each()()('...', fn) or test.each()()('...', fn)
        // it.skip('...', fn) or test.skip('...', fn)
        // it.only('...', fn) or test.only('...', fn)
        if (
          callee.type === "MemberExpression" &&
          callee.object?.type === "Identifier" &&
          (callee.object.name === "it" || callee.object.name === "test")
        ) {
          isTestCall = true;
        }

        // it.each([])('...', fn) - CallExpression with MemberExpression callee
        if (
          callee.type === "CallExpression" &&
          callee.callee?.type === "MemberExpression" &&
          callee.callee.object?.type === "Identifier" &&
          (callee.callee.object.name === "it" ||
            callee.callee.object.name === "test")
        ) {
          isTestCall = true;
        }

        if (!isTestCall) return;

        // Get the callback function (usually the second argument)
        const args = node.arguments;
        if (!args || args.length < 2) return;

        const callback = args[1];
        if (!callback) return;

        // Handle arrow functions and regular functions
        let body: any = null;
        if (
          callback.type === "ArrowFunctionExpression" ||
          callback.type === "FunctionExpression"
        ) {
          body = callback.body;
        }

        if (!body) return;

        const { empty, setupOnly } = isEmptyOrSetupOnly(body);

        if (empty) {
          context.report({
            node,
            messageId: "emptyTest",
          });
          return;
        }

        if (setupOnly) {
          context.report({
            node,
            messageId: "noAssertions",
          });
        }
      },
    };
  },
};

export default rule;
