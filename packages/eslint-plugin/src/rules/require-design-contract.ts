/**
 * Rule: require-design-contract
 *
 * Enforces that API route handlers use the DesignContract wrapper
 * for runtime enforcement of design intent, validation, and error handling.
 *
 * Blocked:
 *   export async function POST(req: Request) { ... }
 *
 * Allowed:
 *   const postContract = DesignContract({...});
 *   export const POST = postContract(async (req, runtime) => { ... });
 *
 * ADR: ADR-002-governance-schema (governance enforcement pattern)
 */

import type { Rule } from "eslint";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

const HTTP_METHODS = /^(GET|POST|PUT|PATCH|DELETE)$/;

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce DesignContract wrapper usage in API routes for runtime validation",
      category: "Contracts",
      recommended: true,
    },
    messages: {
      missingContract:
        "API route handler should use DesignContract wrapper:\n" +
        "  const {{method}}Contract = DesignContract({\n" +
        "    designDoc: 'docs/design/...',\n" +
        "    name: '{{method}}',\n" +
        "    // ... preconditions, postconditions\n" +
        "  });\n" +
        "  export const {{method}} = {{method}}Contract(handler);",
      missingDesignDoc:
        "DesignContract must include 'designDoc' property linking to design documentation",
      missingName:
        "DesignContract must include 'name' property identifying the operation",
      emptyContract:
        "DesignContract must include at least 'designDoc' and 'name' properties",
      designDocNotFound:
        "Design doc '{{path}}' referenced in DesignContract does not exist",
      missingValidation:
        "DesignContract should include 'preconditions' or 'postconditions' for runtime validation",
    },
    schema: [
      {
        type: "object",
        properties: {
          enforceInTests: {
            type: "boolean",
            default: false,
          },
          validateDesignDocExists: {
            type: "boolean",
            default: true,
          },
          requireValidation: {
            type: "boolean",
            default: true,
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const options = context.options[0] || {};
    const enforceInTests = options.enforceInTests === true;
    const validateDesignDocExists = options.validateDesignDocExists !== false;
    const requireValidation = options.requireValidation !== false;

    // Only check API route files
    const isApiRoute =
      filename.includes("/app/api/") && filename.endsWith("route.ts");

    // Skip debug/dev routes
    const isDebugRoute =
      filename.includes("/api/debug/") || filename.includes("/api/dev/");

    // Skip test files unless enforceInTests is true
    if (
      !isApiRoute ||
      isDebugRoute ||
      (!enforceInTests && filename.includes(".test."))
    ) {
      return {};
    }

    const exportedFunctions = new Set<string>();
    const contractWrappedExports = new Set<string>();

    return {
      // Check for direct function exports (GET, POST, etc.)
      ExportNamedDeclaration(node: any) {
        if (node.declaration) {
          // export async function GET() {}
          if (node.declaration.type === "FunctionDeclaration") {
            const name = node.declaration.id?.name;
            if (name && HTTP_METHODS.test(name)) {
              exportedFunctions.add(name);
            }
          }
          // export const GET = ...
          else if (node.declaration.type === "VariableDeclaration") {
            for (const declarator of node.declaration.declarations) {
              if (declarator.id.type === "Identifier") {
                const name = declarator.id.name;
                if (HTTP_METHODS.test(name)) {
                  // Check if it's wrapped in a contract
                  if (
                    declarator.init &&
                    declarator.init.type === "CallExpression"
                  ) {
                    contractWrappedExports.add(name);
                  } else {
                    exportedFunctions.add(name);
                  }
                }
              }
            }
          }
        }
      },

      // Check DesignContract calls for required properties
      CallExpression(node: any) {
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "DesignContract" &&
          node.arguments.length > 0
        ) {
          const configArg = node.arguments[0];
          if (configArg.type === "ObjectExpression") {
            validateContractConfig(
              configArg,
              node,
              context,
              filename,
              validateDesignDocExists,
              requireValidation
            );
          }
        }
      },

      // At the end, check if exported functions are wrapped
      "Program:exit"() {
        for (const method of exportedFunctions) {
          if (!contractWrappedExports.has(method)) {
            context.report({
              loc: { line: 1, column: 0 },
              messageId: "missingContract",
              data: { method },
            });
          }
        }
      },
    };
  },
};

function findProjectRoot(startDir: string): string {
  let projectRoot = startDir;
  while (
    projectRoot !== "/" &&
    !existsSync(join(projectRoot, "package.json"))
  ) {
    projectRoot = dirname(projectRoot);
  }
  return projectRoot;
}

function hasProperty(properties: any[], name: string): boolean {
  return properties.some(
    (p: any) =>
      p.type === "Property" &&
      p.key.type === "Identifier" &&
      p.key.name === name
  );
}

function findProperty(properties: any[], name: string): any {
  return properties.find(
    (p: any) =>
      p.type === "Property" &&
      p.key.type === "Identifier" &&
      p.key.name === name
  );
}

function validateContractConfig(
  configNode: any,
  callNode: any,
  context: Rule.RuleContext,
  filename: string,
  validateDesignDocExists: boolean,
  requireValidation: boolean
): void {
  const properties = configNode.properties;
  const designDocProp = findProperty(properties, "designDoc");
  const hasName = hasProperty(properties, "name");

  if (!designDocProp && !hasName) {
    context.report({ node: callNode, messageId: "emptyContract" });
    return;
  }

  if (!designDocProp) {
    context.report({ node: callNode, messageId: "missingDesignDoc" });
  } else if (validateDesignDocExists) {
    const designDocPath = getDesignDocPath(designDocProp.value);

    if (designDocPath) {
      const projectRoot = findProjectRoot(dirname(filename));
      const fullPath = join(projectRoot, designDocPath);

      if (!existsSync(fullPath)) {
        context.report({
          node: designDocProp.value,
          messageId: "designDocNotFound",
          data: { path: designDocPath },
        });
      }
    }
  }

  if (!hasName) {
    context.report({ node: callNode, messageId: "missingName" });
  }

  if (requireValidation && designDocProp && hasName) {
    const hasPreconditions = hasProperty(properties, "preconditions");
    const hasPostconditions = hasProperty(properties, "postconditions");

    if (!hasPreconditions && !hasPostconditions) {
      context.report({ node: callNode, messageId: "missingValidation" });
    }
  }
}

function getDesignDocPath(node: any): string | null {
  if (node?.type === "Literal" && typeof node.value === "string") {
    return node.value;
  }

  if (node?.type === "TemplateLiteral") {
    // If there are no expressions, combine all quasis (handles backtick strings)
    if (!node.expressions || node.expressions.length === 0) {
      return node.quasis.map((q: any) => q.value.cooked ?? "").join("");
    }

    // If all expressions are string literals, we can statically resolve the path
    const parts: string[] = [];
    for (let i = 0; i < node.quasis.length; i += 1) {
      parts.push(node.quasis[i].value.cooked ?? "");
      if (node.expressions[i]) {
        const expr = node.expressions[i];
        if (expr.type === "Literal" && typeof expr.value === "string") {
          parts.push(expr.value);
        } else {
          return null;
        }
      }
    }
    return parts.join("");
  }

  return null;
}

export default rule;
