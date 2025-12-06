/**
 * Rule: require-precondition-semantics
 *
 * Ensures that DesignContract preconditions actually validate
 * meaningful input properties, not just existence checks or always-true conditions.
 *
 * Blocked:
 *   preconditions: [(ctx) => true || "Always valid"]
 *   preconditions: [(ctx) => ctx !== undefined || "Must have context"]
 *   preconditions: [(ctx) => !!ctx || "Must exist"]
 *
 * Allowed:
 *   preconditions: [(ctx) => ctx.userId?.length > 0 || "User ID required"]
 *   preconditions: [(ctx) => ctx.requestBody.name?.trim() || "Name required"]
 *   preconditions: [(ctx) => Array.isArray(ctx.items) || "Items must be array"]
 *
 * ADR: ADR-002-governance-schema
 */

import type { Rule } from "eslint";

// Properties that indicate meaningful validation on context/input
const MEANINGFUL_PROPERTIES = new Set([
  "userid",
  "user",
  "id",
  "name",
  "email",
  "body",
  "requestbody",
  "params",
  "query",
  "headers",
  "method",
  "url",
  "path",
  "data",
  "payload",
  "input",
  "items",
  "count",
  "length",
  "type",
  "role",
  "permissions",
  "token",
  "session",
  "auth",
  "authenticated",
  "authorized",
  "valid",
  "enabled",
  "active",
  "status",
]);

// Patterns that indicate trivial existence checks or always-true conditions
const TRIVIAL_PATTERNS = [
  // ctx !== undefined
  /^\s*\w+\s*!==?\s*undefined\b/,
  // ctx !== null
  /^\s*\w+\s*!==?\s*null\b/,
  // ctx != null (covers both null and undefined)
  /^\s*\w+\s*!=\s*null\b/,
  // !!ctx
  /^\s*!!\w+\s*$/,
  // Boolean(ctx)
  /^\s*Boolean\s*\(\s*\w+\s*\)/,
  // ctx ? true : false
  /^\s*\w+\s*\?\s*true\s*:\s*false/,
  // typeof ctx !== 'undefined'
  /typeof\s+\w+\s*!==?\s*['"]undefined['"]/,
  // true (literal)
  /^\s*true\s*$/,
  // () => true
  /^\s*\(\s*\)\s*=>\s*true\s*$/,
];

/**
 * Check if a node represents a trivial existence check or always-true condition
 */
function isTrivialCondition(
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

  // Check for literal true
  if (node.type === "Literal" && node.value === true) {
    return true;
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
    case "ChainExpression":
      return accessesMeaningfulProperty(node.expression);
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
    case "ChainExpression":
      return scanNodeForMeaningfulAccess(node.expression);
    default:
      return false;
  }
}

/**
 * Get the body of a function for analysis
 */
function getFunctionBody(node: any): any {
  if (node.type === "ArrowFunctionExpression") {
    // Arrow with expression body: (ctx) => ctx.userId?.length > 0
    if (node.body.type !== "BlockStatement") {
      return node.body;
    }
    // Arrow with block body: (ctx) => { return ctx.userId?.length > 0; }
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
 * Check if the context parameter is passed to a helper function
 * This is a valid pattern: the helper function will validate context properties
 */
function passesContextToHelper(node: any, contextParamName: string): boolean {
  if (!node || !contextParamName) return false;

  if (node.type === "CallExpression") {
    // Check if context is passed as an argument
    for (const arg of node.arguments) {
      if (arg.type === "Identifier" && arg.name === contextParamName) {
        return true;
      }
    }
  }

  // Check await expressions
  if (node.type === "AwaitExpression") {
    return passesContextToHelper(node.argument, contextParamName);
  }

  return false;
}

/**
 * Recursively check if context is passed to any helper function in the AST
 */
function scanForContextPassedToHelper(
  node: any,
  contextParamName: string,
): boolean {
  if (!node || !contextParamName) return false;
  if (passesContextToHelper(node, contextParamName)) return true;

  switch (node.type) {
    case "BlockStatement":
      return node.body.some((stmt: any) =>
        scanForContextPassedToHelper(stmt, contextParamName),
      );
    case "ExpressionStatement":
      return scanForContextPassedToHelper(node.expression, contextParamName);
    case "ReturnStatement":
      return scanForContextPassedToHelper(node.argument, contextParamName);
    case "IfStatement":
      return (
        scanForContextPassedToHelper(node.test, contextParamName) ||
        scanForContextPassedToHelper(node.consequent, contextParamName) ||
        scanForContextPassedToHelper(node.alternate, contextParamName)
      );
    case "ConditionalExpression":
      return (
        scanForContextPassedToHelper(node.test, contextParamName) ||
        scanForContextPassedToHelper(node.consequent, contextParamName) ||
        scanForContextPassedToHelper(node.alternate, contextParamName)
      );
    case "LogicalExpression":
      return (
        scanForContextPassedToHelper(node.left, contextParamName) ||
        scanForContextPassedToHelper(node.right, contextParamName)
      );
    case "BinaryExpression":
      return (
        scanForContextPassedToHelper(node.left, contextParamName) ||
        scanForContextPassedToHelper(node.right, contextParamName)
      );
    case "CallExpression":
      return (
        passesContextToHelper(node, contextParamName) ||
        node.arguments.some((arg: any) =>
          scanForContextPassedToHelper(arg, contextParamName),
        )
      );
    case "AwaitExpression":
      return scanForContextPassedToHelper(node.argument, contextParamName);
    case "VariableDeclaration":
      return node.declarations.some((decl: any) =>
        scanForContextPassedToHelper(decl.init, contextParamName),
      );
    default:
      return false;
  }
}

/**
 * Validate a single precondition element
 */
function validatePreconditionElement(
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

  // Get the context parameter name (first param)
  const contextParamName = getFirstParamName(element);

  // Get the full function body for scanning
  const fullBody = element.body;

  // For expression-body arrow functions, check the expression directly
  if (
    element.type === "ArrowFunctionExpression" &&
    fullBody.type !== "BlockStatement"
  ) {
    // Check for trivial conditions
    if (isTrivialCondition(fullBody, sourceCode)) {
      context.report({
        node: element,
        messageId: "trivialCondition",
      });
      return;
    }

    // Check if it accesses meaningful properties or passes context to helper
    if (
      !accessesMeaningfulProperty(fullBody) &&
      !passesContextToHelper(fullBody, contextParamName ?? "")
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
    const hasMeaningfulAccess = scanNodeForMeaningfulAccess(fullBody);
    const passesToHelper = scanForContextPassedToHelper(
      fullBody,
      contextParamName ?? "",
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

  // Check for trivial conditions
  if (isTrivialCondition(body, sourceCode)) {
    context.report({
      node: element,
      messageId: "trivialCondition",
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
 * Process preconditions property from DesignContract config
 */
function processPreconditionsProperty(
  prop: any,
  sourceCode: ReturnType<Rule.RuleContext["getSourceCode"]>,
  context: Rule.RuleContext,
): void {
  if (prop.type !== "Property") return;
  if (prop.key.type !== "Identifier") return;
  if (prop.key.name !== "preconditions") return;
  if (prop.value.type !== "ArrayExpression") return;

  for (const element of prop.value.elements) {
    validatePreconditionElement(element, sourceCode, context);
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Validate that DesignContract preconditions check meaningful input properties",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      trivialCondition:
        "Precondition is trivial (always true or just existence check). " +
        "Validate meaningful input properties like userId, requestBody, params, etc. " +
        "Example: (ctx) => ctx.userId?.length > 0 || 'User ID required'",
      noPropertyAccess:
        "Precondition does not access any meaningful context properties. " +
        "Check properties like: userId, requestBody, params, query, headers. " +
        "Example: (ctx) => ctx.requestBody.name?.trim() || 'Name required'",
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

        // Find and process preconditions property
        for (const prop of configArg.properties) {
          processPreconditionsProperty(prop, sourceCode, context);
        }
      },
    };
  },
};

export default rule;
