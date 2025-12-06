/**
 * Rule: require-postcondition-semantics
 *
 * Ensures that DesignContract postconditions actually validate
 * meaningful response properties, not just existence checks.
 *
 * Blocked:
 *   postconditions: [(result) => result !== undefined || "Must have result"]
 *   postconditions: [(result) => !!result || "Must exist"]
 *   postconditions: [(r) => r != null || "Required"]
 *
 * Allowed:
 *   postconditions: [(result) => result.status === 200 || "Must return 200"]
 *   postconditions: [(result) => result.body.length > 0 || "Must have body"]
 *   postconditions: [(result) => Array.isArray(result.data) || "Must return array"]
 *
 * ADR: ADR-002-governance-schema
 */

import type { Rule } from "eslint";

// Properties that indicate meaningful validation
const MEANINGFUL_PROPERTIES = new Set([
  "status",
  "statuscode",
  "body",
  "data",
  "json",
  "text",
  "headers",
  "ok",
  "error",
  "message",
  "id",
  "count",
  "length",
  "items",
  "results",
  "total",
  "success",
  "created",
  "updated",
  "deleted",
]);

// Patterns that indicate trivial existence checks
const TRIVIAL_PATTERNS = [
  // result !== undefined
  /^\s*\w+\s*!==?\s*undefined\b/,
  // result !== null
  /^\s*\w+\s*!==?\s*null\b/,
  // result != null (covers both null and undefined)
  /^\s*\w+\s*!=\s*null\b/,
  // !!result
  /^\s*!!\w+\s*$/,
  // Boolean(result)
  /^\s*Boolean\s*\(\s*\w+\s*\)/,
  // result ? true : false
  /^\s*\w+\s*\?\s*true\s*:\s*false/,
  // typeof result !== 'undefined'
  /typeof\s+\w+\s*!==?\s*['"]undefined['"]/,
];

/**
 * Check if a node represents a trivial existence check
 */
function isTrivialExistenceCheck(
  node: any,
  sourceCode: ReturnType<Rule.RuleContext["getSourceCode"]>,
): boolean {
  if (!node) return false;

  const text = sourceCode.getText(node).trim();

  // Check against trivial patterns
  for (const pattern of TRIVIAL_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a node accesses meaningful properties
 */
function accessesMeaningfulProperty(node: any): boolean {
  if (!node) return false;

  switch (node.type) {
    case "MemberExpression": {
      const propertyName =
        node.property.type === "Identifier" ? node.property.name : null;
      if (
        propertyName &&
        MEANINGFUL_PROPERTIES.has(propertyName.toLowerCase())
      ) {
        return true;
      }
      return accessesMeaningfulProperty(node.object);
    }
    case "BinaryExpression":
      return (
        accessesMeaningfulProperty(node.left) ||
        accessesMeaningfulProperty(node.right)
      );
    case "LogicalExpression":
      return (
        accessesMeaningfulProperty(node.left) ||
        accessesMeaningfulProperty(node.right)
      );
    case "CallExpression":
      for (const arg of node.arguments) {
        if (accessesMeaningfulProperty(arg)) {
          return true;
        }
      }
      return accessesMeaningfulProperty(node.callee);
    case "UnaryExpression":
      return accessesMeaningfulProperty(node.argument);
    case "ConditionalExpression":
      return (
        accessesMeaningfulProperty(node.test) ||
        accessesMeaningfulProperty(node.consequent) ||
        accessesMeaningfulProperty(node.alternate)
      );
    case "AwaitExpression":
      return accessesMeaningfulProperty(node.argument);
    default:
      return false;
  }
}

/**
 * Recursively check all nodes in an AST subtree for meaningful property access
 */
function scanNodeForMeaningfulAccess(node: any): boolean {
  if (!node) return false;
  if (accessesMeaningfulProperty(node)) return true;

  switch (node.type) {
    case "BlockStatement":
      return node.body.some((stmt: any) => scanNodeForMeaningfulAccess(stmt));
    case "ExpressionStatement":
      return scanNodeForMeaningfulAccess(node.expression);
    case "VariableDeclaration":
      return node.declarations.some((decl: any) =>
        scanNodeForMeaningfulAccess(decl.init),
      );
    case "IfStatement":
      return (
        scanNodeForMeaningfulAccess(node.test) ||
        scanNodeForMeaningfulAccess(node.consequent) ||
        scanNodeForMeaningfulAccess(node.alternate)
      );
    case "ReturnStatement":
      return scanNodeForMeaningfulAccess(node.argument);
    case "ConditionalExpression":
      return (
        scanNodeForMeaningfulAccess(node.test) ||
        scanNodeForMeaningfulAccess(node.consequent) ||
        scanNodeForMeaningfulAccess(node.alternate)
      );
    case "LogicalExpression":
      return (
        scanNodeForMeaningfulAccess(node.left) ||
        scanNodeForMeaningfulAccess(node.right)
      );
    case "BinaryExpression":
      return (
        scanNodeForMeaningfulAccess(node.left) ||
        scanNodeForMeaningfulAccess(node.right)
      );
    case "CallExpression":
      return (
        scanNodeForMeaningfulAccess(node.callee) ||
        node.arguments.some((arg: any) => scanNodeForMeaningfulAccess(arg))
      );
    case "MemberExpression":
      return accessesMeaningfulProperty(node);
    case "AwaitExpression":
      return scanNodeForMeaningfulAccess(node.argument);
    case "UnaryExpression":
      return scanNodeForMeaningfulAccess(node.argument);
    case "ObjectExpression":
      return node.properties.some(
        (prop: any) =>
          scanNodeForMeaningfulAccess(prop.key) ||
          scanNodeForMeaningfulAccess(prop.value),
      );
    case "ArrayExpression":
      return node.elements.some((el: any) => scanNodeForMeaningfulAccess(el));
    case "TryStatement":
      return (
        scanNodeForMeaningfulAccess(node.block) ||
        scanNodeForMeaningfulAccess(node.handler?.body) ||
        scanNodeForMeaningfulAccess(node.finalizer)
      );
    case "CatchClause":
      return scanNodeForMeaningfulAccess(node.body);
    default:
      return false;
  }
}

/**
 * Get the body of a function for analysis
 */
function getFunctionBody(node: any): any {
  if (node.type === "ArrowFunctionExpression") {
    // Arrow with expression body: (x) => x.status === 200
    if (node.body.type !== "BlockStatement") {
      return node.body;
    }
    // Arrow with block body: (x) => { return x.status === 200; }
    const returnStmt = node.body.body.find(
      (s: any) => s.type === "ReturnStatement",
    );
    return returnStmt?.argument;
  }

  if (node.type === "FunctionExpression") {
    const returnStmt = node.body.body.find(
      (s: any) => s.type === "ReturnStatement",
    );
    return returnStmt?.argument;
  }

  return null;
}

/**
 * Get the first parameter name from a function element
 */
function getFirstParamName(element: any): string | null {
  if (!element.params || element.params.length === 0) return null;
  const firstParam = element.params[0];
  if (firstParam.type === "Identifier") {
    return firstParam.name;
  }
  return null;
}

/**
 * Check if the response parameter is passed to a helper function
 * This is a valid pattern: the helper function will access response properties
 */
function passesResponseToHelper(node: any, responseParamName: string): boolean {
  if (!node || !responseParamName) return false;

  if (node.type === "CallExpression") {
    // Check if response is passed as an argument
    for (const arg of node.arguments) {
      if (arg.type === "Identifier" && arg.name === responseParamName) {
        return true;
      }
    }
  }

  // Check await expressions
  if (node.type === "AwaitExpression") {
    return passesResponseToHelper(node.argument, responseParamName);
  }

  return false;
}

/**
 * Recursively check if response is passed to any helper function in the AST
 */
function scanForResponsePassedToHelper(
  node: any,
  responseParamName: string,
): boolean {
  if (!node || !responseParamName) return false;
  if (passesResponseToHelper(node, responseParamName)) return true;

  switch (node.type) {
    case "BlockStatement":
      return node.body.some((stmt: any) =>
        scanForResponsePassedToHelper(stmt, responseParamName),
      );
    case "ExpressionStatement":
      return scanForResponsePassedToHelper(node.expression, responseParamName);
    case "ReturnStatement":
      return scanForResponsePassedToHelper(node.argument, responseParamName);
    case "IfStatement":
      return (
        scanForResponsePassedToHelper(node.test, responseParamName) ||
        scanForResponsePassedToHelper(node.consequent, responseParamName) ||
        scanForResponsePassedToHelper(node.alternate, responseParamName)
      );
    case "ConditionalExpression":
      return (
        scanForResponsePassedToHelper(node.test, responseParamName) ||
        scanForResponsePassedToHelper(node.consequent, responseParamName) ||
        scanForResponsePassedToHelper(node.alternate, responseParamName)
      );
    case "LogicalExpression":
      return (
        scanForResponsePassedToHelper(node.left, responseParamName) ||
        scanForResponsePassedToHelper(node.right, responseParamName)
      );
    case "BinaryExpression":
      return (
        scanForResponsePassedToHelper(node.left, responseParamName) ||
        scanForResponsePassedToHelper(node.right, responseParamName)
      );
    case "CallExpression":
      return (
        passesResponseToHelper(node, responseParamName) ||
        node.arguments.some((arg: any) =>
          scanForResponsePassedToHelper(arg, responseParamName),
        )
      );
    case "AwaitExpression":
      return scanForResponsePassedToHelper(node.argument, responseParamName);
    case "VariableDeclaration":
      return node.declarations.some((decl: any) =>
        scanForResponsePassedToHelper(decl.init, responseParamName),
      );
    default:
      return false;
  }
}

/**
 * Validate a single postcondition element
 */
function validatePostconditionElement(
  element: any,
  sourceCode: ReturnType<Rule.RuleContext["getSourceCode"]>,
  context: Rule.RuleContext,
): void {
  if (!element) return;
  if (
    element.type !== "ArrowFunctionExpression" &&
    element.type !== "FunctionExpression"
  ) {
    return;
  }

  // Get the response parameter name (first param)
  const responseParamName = getFirstParamName(element);

  // Get the full function body for scanning
  const fullBody = element.body;

  // For expression-body arrow functions, check the expression directly
  if (
    element.type === "ArrowFunctionExpression" &&
    fullBody.type !== "BlockStatement"
  ) {
    // Check for trivial existence checks
    if (isTrivialExistenceCheck(fullBody, sourceCode)) {
      context.report({
        node: element,
        messageId: "trivialExistenceCheck",
      });
      return;
    }

    // Check if it accesses meaningful properties or passes response to helper
    if (
      !accessesMeaningfulProperty(fullBody) &&
      !passesResponseToHelper(fullBody, responseParamName ?? "")
    ) {
      context.report({
        node: element,
        messageId: "noPropertyAccess",
      });
    }
    return;
  }

  // For block-body functions, scan the entire body
  if (fullBody.type === "BlockStatement") {
    // Check if any part of the function body accesses meaningful properties
    // or passes response to a helper function
    const hasMeaningfulAccess = scanNodeForMeaningfulAccess(fullBody);
    const passesToHelper = scanForResponsePassedToHelper(
      fullBody,
      responseParamName ?? "",
    );

    if (!hasMeaningfulAccess && !passesToHelper) {
      context.report({
        node: element,
        messageId: "noPropertyAccess",
      });
    }
    return;
  }

  // Fallback to old behavior for other cases
  const body = getFunctionBody(element);
  if (!body) return;

  // Check for trivial existence checks
  if (isTrivialExistenceCheck(body, sourceCode)) {
    context.report({
      node: element,
      messageId: "trivialExistenceCheck",
    });
    return;
  }

  // Check if it accesses meaningful properties
  if (!accessesMeaningfulProperty(body)) {
    context.report({
      node: element,
      messageId: "noPropertyAccess",
    });
  }
}

/**
 * Process postconditions property from DesignContract config
 */
function processPostconditionsProperty(
  prop: any,
  sourceCode: ReturnType<Rule.RuleContext["getSourceCode"]>,
  context: Rule.RuleContext,
): void {
  if (prop.type !== "Property") return;
  if (prop.key.type !== "Identifier") return;
  if (prop.key.name !== "postconditions") return;
  if (prop.value.type !== "ArrayExpression") return;

  for (const element of prop.value.elements) {
    validatePostconditionElement(element, sourceCode, context);
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Validate that DesignContract postconditions check meaningful response properties",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      trivialExistenceCheck:
        "Postcondition only checks existence, not meaningful properties. " +
        "Validate response properties like status, body, data, etc. " +
        "Example: (result) => result.status === 200 || 'Must return 200'",
      noPropertyAccess:
        "Postcondition does not access any response properties. " +
        "Check properties like: status, body, data, headers, ok, error, message. " +
        "Example: (result) => result.data.length > 0 || 'Must have data'",
    },
    schema: [
      {
        type: "object",
        properties: {
          additionalMeaningfulProperties: {
            type: "array",
            items: { type: "string" },
            default: [],
            description: "Additional property names to consider meaningful",
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const options = (context.options[0] || {}) as {
      additionalMeaningfulProperties?: string[];
    };
    const additionalProps = options.additionalMeaningfulProperties || [];

    // Add any additional meaningful properties
    for (const prop of additionalProps) {
      MEANINGFUL_PROPERTIES.add(prop.toLowerCase());
    }

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

        // Find and process postconditions property
        for (const prop of configArg.properties) {
          processPostconditionsProperty(prop, sourceCode, context);
        }
      },
    };
  },
};

export default rule;
