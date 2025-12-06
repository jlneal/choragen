/**
 * Rule: no-trivial-assertions
 *
 * Catches meaningless assertions that always pass without testing real behavior.
 *
 * Blocked:
 *   expect(true).toBe(true)
 *   expect(1).toBe(1)
 *   expect(x).toBe(x) (same variable)
 *   expect(null).toBeNull()
 *   expect(undefined).toBeUndefined()
 *   expect(arr.length).toBeGreaterThan(-1)
 *
 * Allowed:
 *   expect(result).toBe(true)
 *   expect(response.status).toBe(200)
 *
 * ADR: ADR-002-governance-schema
 */

import type { Rule } from "eslint";

/**
 * Check if a node is a literal value
 */
function isLiteral(node: any): boolean {
  if (!node) return false;
  return (
    node.type === "Literal" ||
    (node.type === "Identifier" &&
      (node.name === "undefined" ||
        node.name === "null" ||
        node.name === "NaN" ||
        node.name === "Infinity"))
  );
}

/**
 * Check if two nodes represent the same literal value
 */
function areSameLiteral(node1: any, node2: any): boolean {
  if (!isLiteral(node1) || !isLiteral(node2)) return false;

  if (node1.type === "Literal" && node2.type === "Literal") {
    return node1.value === node2.value;
  }

  if (node1.type === "Identifier" && node2.type === "Identifier") {
    return node1.name === node2.name;
  }

  return false;
}

/**
 * Check if two nodes are the same identifier (same variable)
 */
function areSameIdentifier(node1: any, node2: any): boolean {
  if (node1.type !== "Identifier" || node2.type !== "Identifier") return false;
  return node1.name === node2.name;
}

/**
 * Get string representation of a node for error messages
 */
function nodeToString(node: any): string {
  if (!node) return "unknown";
  if (node.type === "Literal") {
    return JSON.stringify(node.value);
  }
  if (node.type === "Identifier") {
    return node.name;
  }
  return "expression";
}

/**
 * Check if node is always truthy (non-empty string, object literal, etc.)
 */
function isAlwaysTruthy(node: any): boolean {
  if (!node) return false;

  // Non-empty string literal
  if (node.type === "Literal" && typeof node.value === "string") {
    return node.value.length > 0;
  }

  // Object/array literal
  if (node.type === "ObjectExpression" || node.type === "ArrayExpression") {
    return true;
  }

  // Template literal (always truthy unless empty)
  if (node.type === "TemplateLiteral") {
    return true;
  }

  return false;
}

/**
 * Check if a number is always greater than the comparison value
 */
function isAlwaysGreaterThan(node: any, compareValue: number): boolean {
  // .length is always >= 0, so > -1 is always true
  if (
    node.type === "MemberExpression" &&
    node.property?.type === "Identifier" &&
    node.property.name === "length" &&
    compareValue < 0
  ) {
    return true;
  }
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Detect trivial test assertions that don't meaningfully test anything",
      category: "Test Quality",
      recommended: true,
    },
    messages: {
      trivialAssertion:
        "Trivial assertion detected: {{assertion}}. " +
        "This test passes without testing any real behavior. " +
        "Assert on actual computed values, not literals.",
      sameVariableAssertion:
        "Trivial assertion: expect({{variable}}).{{matcher}}({{variable}}). " +
        "Comparing a variable to itself always passes.",
      trivialNullCheck:
        "Trivial null/undefined check: expect({{value}}).{{matcher}}(). " +
        "Assert on actual values from your code, not literal null/undefined.",
      alwaysTrueCondition:
        "Assertion always passes: expect({{expression}}).toBeTruthy(). " +
        "Non-empty strings/objects are always truthy. Test actual behavior.",
      alwaysGreaterThan:
        "Assertion always passes: expect({{expression}}).toBeGreaterThan({{value}}). " +
        "{{reason}}",
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
      filename.endsWith(".test.mjs");

    if (!isTestFile) {
      return {};
    }

    return {
      CallExpression(node: any) {
        // Look for expect(...).matcher(...) patterns
        if (
          node.callee?.type !== "MemberExpression" ||
          node.callee.object?.type !== "CallExpression"
        ) {
          return;
        }

        const expectCall = node.callee.object;
        const matcher = node.callee.property;

        // Check if this is an expect() call
        if (
          expectCall.callee?.type !== "Identifier" ||
          expectCall.callee.name !== "expect"
        ) {
          return;
        }

        const expectArg = expectCall.arguments[0];
        if (!expectArg) return;

        const matcherName =
          matcher?.type === "Identifier" ? matcher.name : null;
        const matcherArgs = node.arguments;

        if (!matcherName) return;

        // Check for expect(literal).toBe(sameLiteral)
        const toBeMatchers = ["toBe", "toEqual", "toStrictEqual"];
        if (toBeMatchers.includes(matcherName) && matcherArgs.length > 0) {
          const matcherArg = matcherArgs[0];
          if (areSameLiteral(expectArg, matcherArg)) {
            context.report({
              node,
              messageId: "trivialAssertion",
              data: {
                assertion: `expect(${nodeToString(expectArg)}).${matcherName}(${nodeToString(matcherArg)})`,
              },
            });
            return;
          }

          // Check for expect(x).toBe(x) - same variable
          if (areSameIdentifier(expectArg, matcherArg)) {
            context.report({
              node,
              messageId: "sameVariableAssertion",
              data: {
                variable: nodeToString(expectArg),
                matcher: matcherName,
              },
            });
            return;
          }
        }

        // Check for expect(null).toBeNull()
        if (matcherName === "toBeNull" && isLiteral(expectArg)) {
          if (
            (expectArg.type === "Literal" && expectArg.value === null) ||
            (expectArg.type === "Identifier" && expectArg.name === "null")
          ) {
            context.report({
              node,
              messageId: "trivialNullCheck",
              data: { value: "null", matcher: "toBeNull" },
            });
            return;
          }
        }

        // Check for expect(undefined).toBeUndefined()
        if (matcherName === "toBeUndefined" && isLiteral(expectArg)) {
          if (
            expectArg.type === "Identifier" &&
            expectArg.name === "undefined"
          ) {
            context.report({
              node,
              messageId: "trivialNullCheck",
              data: { value: "undefined", matcher: "toBeUndefined" },
            });
            return;
          }
        }

        // Check for expect(alwaysTruthy).toBeTruthy()
        if (matcherName === "toBeTruthy") {
          if (isAlwaysTruthy(expectArg)) {
            context.report({
              node,
              messageId: "alwaysTrueCondition",
              data: { expression: nodeToString(expectArg) },
            });
            return;
          }
          if (expectArg.type === "Literal" && expectArg.value === true) {
            context.report({
              node,
              messageId: "trivialAssertion",
              data: { assertion: "expect(true).toBeTruthy()" },
            });
            return;
          }
        }

        // Check for expect(false).toBeFalsy()
        if (matcherName === "toBeFalsy") {
          if (expectArg.type === "Literal" && expectArg.value === false) {
            context.report({
              node,
              messageId: "trivialAssertion",
              data: { assertion: "expect(false).toBeFalsy()" },
            });
            return;
          }
        }

        // Check for expect(arr.length).toBeGreaterThan(-1)
        if (matcherName === "toBeGreaterThan" && matcherArgs.length > 0) {
          const compareArg = matcherArgs[0];
          if (
            compareArg.type === "Literal" &&
            typeof compareArg.value === "number"
          ) {
            const compareValue = compareArg.value as number;
            if (isAlwaysGreaterThan(expectArg, compareValue)) {
              context.report({
                node,
                messageId: "alwaysGreaterThan",
                data: {
                  expression: ".length",
                  value: String(compareValue),
                  reason: "Array/string length is always >= 0.",
                },
              });
              return;
            }
          }
        }
      },
    };
  },
};

export default rule;
