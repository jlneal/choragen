/**
 * Rule: require-try-catch-in-async
 *
 * Flags async functions in targeted directories that are missing try-catch error handling.
 * This ensures proper error handling patterns are followed in production code.
 *
 * ADR: ADR-002-governance-schema (code hygiene enforcement)
 */

import type { Rule } from "eslint";

const DEFAULT_DIRECTORIES = ["lib"];
const DEFAULT_MIN_STATEMENTS = 2;
const DEFAULT_ALLOW_THROW = true;

const MESSAGE_ID = "missingTryCatch";

interface RuleOptions {
  directories?: string[];
  minStatements?: number;
  allowThrow?: boolean;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Flag async functions in targeted directories that are missing try-catch error handling",
      category: "Code Hygiene",
      recommended: false,
    },
    messages: {
      [MESSAGE_ID]:
        "Async function '{{functionName}}' should have try-catch error handling.",
    },
    schema: [
      {
        type: "object",
        properties: {
          directories: {
            type: "array",
            items: { type: "string" },
          },
          minStatements: {
            type: "number",
            minimum: 0,
          },
          allowThrow: {
            type: "boolean",
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    const normalizedFilename = filename.replace(/\\/g, "/");
    const options: RuleOptions = {
      directories: DEFAULT_DIRECTORIES,
      minStatements: DEFAULT_MIN_STATEMENTS,
      allowThrow: DEFAULT_ALLOW_THROW,
      ...(context.options[0] as RuleOptions | undefined),
    };

    const targetDirectories =
      options.directories && options.directories.length > 0
        ? options.directories
        : DEFAULT_DIRECTORIES;

    if (
      !isInTargetDirectory(normalizedFilename, targetDirectories) ||
      isTestFile(normalizedFilename)
    ) {
      return {};
    }

    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const visitorKeys = sourceCode.visitorKeys ?? {};

    const checkFunction = (node: any): void => {
      if (!node.async) {
        return;
      }

      if (isCallbackFunction(node)) {
        return;
      }

      const bodyInfo = getBodyInfo(node);

      if (!bodyInfo) {
        return;
      }

      if (bodyInfo.isSingleReturn) {
        return;
      }

      if (bodyInfo.statementCount < (options.minStatements ?? DEFAULT_MIN_STATEMENTS)) {
        return;
      }

      if (options.allowThrow && containsThrow(node.body, visitorKeys)) {
        return;
      }

      if (containsTryCatch(node.body, visitorKeys)) {
        return;
      }

      context.report({
        node,
        messageId: MESSAGE_ID,
        data: {
          functionName: getFunctionName(node),
        },
      });
    };

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
};

function isInTargetDirectory(filename: string, directories: string[]): boolean {
  return directories.some((dir) => {
    const escapedDir = dir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const directoryPattern = new RegExp(`(?:^|/)${escapedDir}(?:/|$)`);
    return directoryPattern.test(filename);
  });
}

function isTestFile(filename: string): boolean {
  return (
    filename.includes("/__tests__/") ||
    filename.endsWith(".test.ts") ||
    filename.endsWith(".test.tsx") ||
    filename.endsWith(".test.js") ||
    filename.endsWith(".test.jsx") ||
    filename.endsWith(".test.mjs") ||
    filename.endsWith(".test.cjs") ||
    filename.endsWith(".test.mts") ||
    filename.endsWith(".test.cts")
  );
}

function isCallbackFunction(node: any): boolean {
  const parent = node.parent;
  if (!parent) {
    return false;
  }

  if (
    (parent.type === "CallExpression" ||
      parent.type === "NewExpression" ||
      parent.type === "OptionalCallExpression") &&
    Array.isArray(parent.arguments) &&
    parent.arguments.includes(node)
  ) {
    return true;
  }

  return false;
}

interface BodyInfo {
  statementCount: number;
  isSingleReturn: boolean;
}

function getBodyInfo(node: any): BodyInfo | null {
  if (!node.body) {
    return null;
  }

  if (node.body.type !== "BlockStatement") {
    return {
      statementCount: 1,
      isSingleReturn: true,
    };
  }

  const statements = node.body.body;
  const isSingleReturn =
    statements.length === 1 && statements[0].type === "ReturnStatement";

  return {
    statementCount: statements.length,
    isSingleReturn,
  };
}

function getFunctionName(node: any): string {
  if (node.id && node.id.name) {
    return node.id.name;
  }

  const parent = node.parent;

  if (
    parent &&
    parent.type === "VariableDeclarator" &&
    parent.id.type === "Identifier"
  ) {
    return parent.id.name;
  }

  if (
    parent &&
    parent.type === "Property" &&
    !parent.computed &&
    parent.key.type === "Identifier"
  ) {
    return parent.key.name;
  }

  if (
    parent &&
    parent.type === "AssignmentExpression" &&
    parent.left.type === "Identifier"
  ) {
    return parent.left.name;
  }

  return "anonymous";
}

function containsTryCatch(node: any, visitorKeys: Record<string, string[]>): boolean {
  if (!node) {
    return false;
  }

  const stack: any[] = [node];

  while (stack.length > 0) {
    const current = stack.pop();

    if (current.type === "TryStatement" && current.handler) {
      return true;
    }

    if (current !== node && isFunctionNode(current)) {
      continue;
    }

    const keys = visitorKeys[current.type] ?? [];
    for (const key of keys) {
      const child = current[key];
      if (Array.isArray(child)) {
        for (const value of child) {
          if (value && typeof value.type === "string") {
            stack.push(value);
          }
        }
      } else if (child && typeof child.type === "string") {
        stack.push(child);
      }
    }
  }

  return false;
}

function containsThrow(node: any, visitorKeys: Record<string, string[]>): boolean {
  if (!node) {
    return false;
  }

  const stack: any[] = [node];

  while (stack.length > 0) {
    const current = stack.pop();

    if (current.type === "ThrowStatement") {
      return true;
    }

    if (current !== node && isFunctionNode(current)) {
      continue;
    }

    const keys = visitorKeys[current.type] ?? [];
    for (const key of keys) {
      const child = current[key];
      if (Array.isArray(child)) {
        for (const value of child) {
          if (value && typeof value.type === "string") {
            stack.push(value);
          }
        }
      } else if (child && typeof child.type === "string") {
        stack.push(child);
      }
    }
  }

  return false;
}

function isFunctionNode(node: any): boolean {
  return (
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression"
  );
}

export default rule;
