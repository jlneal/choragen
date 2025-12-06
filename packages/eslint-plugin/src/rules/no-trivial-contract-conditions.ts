/**
 * Rule: no-trivial-contract-conditions
 *
 * Detects trivial contract conditions that always pass without meaningful validation.
 *
 * Blocked:
 *   preconditions: [() => true]
 *   postconditions: [(result) => true]
 *   preconditions: [() => "always valid"]
 *   postconditions: [(_) => true]
 *   preconditions: [(x) => !!x] (double negation without property access)
 *   preconditions: [() => {}] (empty body, returns undefined)
 *   preconditions: [() => 1] (truthy literal)
 *
 * Allowed:
 *   preconditions: [(ctx) => ctx.userId !== undefined || "User required"]
 *   postconditions: [(result) => result.status === 200 || "Must return 200"]
 *   preconditions: [(req) => validateSchema(req.body)]
 *
 * ADR: ADR-002-governance-schema
 */

import type { Rule } from "eslint";

/**
 * Check if a function body always returns true/truthy literal
 */
function isAlwaysTruthy(node: any): boolean {
  if (!node) return false;

  // Arrow function with expression body: () => true
  if (node.type === "ArrowFunctionExpression" && node.body) {
    // Direct literal return
    if (node.body.type === "Literal") {
      return node.body.value === true || typeof node.body.value === "string";
    }

    // Identifier true
    if (node.body.type === "Identifier" && node.body.name === "true") {
      return true;
    }

    // Block body with return statement
    if (node.body.type === "BlockStatement") {
      return hasOnlyTruthyReturn(node.body);
    }
  }

  // Regular function
  if (node.type === "FunctionExpression" && node.body) {
    return hasOnlyTruthyReturn(node.body);
  }

  return false;
}

/**
 * Check if a block only contains a truthy return
 */
function hasOnlyTruthyReturn(blockNode: any): boolean {
  if (!blockNode || blockNode.type !== "BlockStatement") return false;

  const statements = blockNode.body.filter(
    (s: any) => s.type !== "EmptyStatement",
  );

  if (statements.length !== 1) return false;

  const stmt = statements[0];
  if (stmt.type !== "ReturnStatement") return false;

  const arg = stmt.argument;
  if (!arg) return false;

  if (arg.type === "Literal") {
    return arg.value === true || typeof arg.value === "string";
  }

  if (arg.type === "Identifier" && arg.name === "true") {
    return true;
  }

  return false;
}

/**
 * Check if function parameters are used in the body
 */
function hasUnusedParams(
  node: any,
  sourceCode: ReturnType<Rule.RuleContext["getSourceCode"]>,
): string[] {
  if (
    node.type !== "ArrowFunctionExpression" &&
    node.type !== "FunctionExpression"
  ) {
    return [];
  }

  const params = node.params;
  if (params.length === 0) return [];

  const unusedParams: string[] = [];
  const bodyText = sourceCode.getText(node.body);

  for (const param of params) {
    let paramName: string | null = null;

    if (param.type === "Identifier") {
      paramName = param.name;
    } else if (
      param.type === "RestElement" &&
      param.argument.type === "Identifier"
    ) {
      paramName = param.argument.name;
    }

    if (paramName && !paramName.startsWith("_")) {
      // Check if param is used in body (simple heuristic)
      const paramPattern = new RegExp(`\\b${paramName}\\b`);
      if (!paramPattern.test(bodyText)) {
        unusedParams.push(paramName);
      }
    }
  }

  return unusedParams;
}

/**
 * Validate conditions array for trivial entries
 */
function validateConditionsArray(
  node: any,
  conditionType: "preconditions" | "postconditions",
  sourceCode: ReturnType<Rule.RuleContext["getSourceCode"]>,
  context: Rule.RuleContext,
): void {
  if (node.type !== "ArrayExpression") return;

  // Empty array
  if (node.elements.length === 0) {
    context.report({
      node,
      messageId: "emptyConditionsArray",
      data: { type: conditionType },
    });
    return;
  }

  // Check each condition
  for (const element of node.elements) {
    if (!element) continue;

    // Check for always-truthy conditions
    if (isAlwaysTruthy(element)) {
      context.report({
        node: element,
        messageId:
          conditionType === "preconditions"
            ? "trivialPrecondition"
            : "trivialPostcondition",
      });
      continue;
    }

    // Check for unused parameters (indicates condition doesn't validate input)
    const unusedParams = hasUnusedParams(element, sourceCode);
    for (const param of unusedParams) {
      context.report({
        node: element,
        messageId: "unusedParameter",
        data: { param },
      });
    }
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Detect trivial contract conditions that always pass without validation",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      trivialPrecondition:
        "Trivial precondition detected: condition always returns true. " +
        "Preconditions should validate actual requirements. " +
        "Example: (ctx) => ctx.userId !== undefined || 'User required'",
      trivialPostcondition:
        "Trivial postcondition detected: condition always returns true. " +
        "Postconditions should validate actual results. " +
        "Example: (result) => result.status === 200 || 'Must return 200'",
      emptyConditionsArray:
        "Empty {{type}} array provides no runtime guarantees. " +
        "Add meaningful validation conditions or remove the property.",
      unusedParameter:
        "Condition parameter '{{param}}' is unused. " +
        "Conditions should validate their input, not ignore it.",
    },
    schema: [],
  },

  create(context) {
    const filename = context.filename || context.getFilename();

    // Only check API route files where DesignContract is used
    const isApiRoute =
      filename.includes("/app/api/") && filename.endsWith("route.ts");

    if (!isApiRoute) {
      return {};
    }

    const sourceCode = context.getSourceCode();

    return {
      CallExpression(node: any) {
        // Look for DesignContract({ ... }) calls
        if (
          node.callee.type !== "Identifier" ||
          node.callee.name !== "DesignContract"
        ) {
          return;
        }

        if (node.arguments.length === 0) return;

        const configArg = node.arguments[0];
        if (configArg.type !== "ObjectExpression") return;

        // Find preconditions and postconditions properties
        for (const prop of configArg.properties) {
          if (prop.type !== "Property") continue;
          if (prop.key.type !== "Identifier") continue;

          if (prop.key.name === "preconditions") {
            validateConditionsArray(
              prop.value,
              "preconditions",
              sourceCode,
              context,
            );
          }

          if (prop.key.name === "postconditions") {
            validateConditionsArray(
              prop.value,
              "postconditions",
              sourceCode,
              context,
            );
          }
        }
      },
    };
  },
};

export default rule;
