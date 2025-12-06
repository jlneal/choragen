/**
 * Rule: require-error-handler
 *
 * Enforces proper error handling in API routes:
 * 1. API route handlers use createApiErrorHandler or withErrorHandler
 * 2. Catch blocks include proper context (action, context, fallbackMessage)
 * 3. Errors are not logged with console.error in API routes
 *
 * ADR: ADR-002-governance-schema (code hygiene enforcement)
 */

import type { Rule } from "eslint";

const EMPTY_CATCH_BODY_LENGTH = 0;
const MIN_HANDLE_API_ERROR_ARGS = 3;
const MIN_ERROR_HANDLER_OPTIONS_ARGS = 2;

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce proper error handling with automatic admin log routing in API routes",
      category: "Code Hygiene",
      recommended: true,
    },
    messages: {
      missingErrorHandler:
        "API route catch blocks must use createApiErrorHandler or withErrorHandler from @/lib/error-handling",
      consoleErrorInApiRoute:
        "Do not use console.error in API routes. Use createApiErrorHandler instead.",
      missingErrorContext:
        "Error handler must include action, context, and fallbackMessage",
      bareHandleApiError:
        "Use createApiErrorHandler instead of handleApiError for better error tracking",
    },
    schema: [],
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    const isApiRoute =
      filename.includes("/app/api/") && filename.endsWith("route.ts");

    if (!isApiRoute) {
      return {};
    }

    let hasErrorHandlerImport = false;
    let hasWithErrorHandlerImport = false;

    return {
      // Check for proper imports
      ImportDeclaration(node: any) {
        if (
          node.source.value === "@/lib/error-handling" ||
          node.source.value === "@/lib"
        ) {
          const specifiers = node.specifiers;
          for (const spec of specifiers) {
            if (
              spec.type === "ImportSpecifier" &&
              spec.imported.name === "createApiErrorHandler"
            ) {
              hasErrorHandlerImport = true;
            }
            if (
              spec.type === "ImportSpecifier" &&
              spec.imported.name === "withErrorHandler"
            ) {
              hasWithErrorHandlerImport = true;
            }
          }
        }
      },

      // Check for console.error usage
      "CallExpression[callee.object.name='console'][callee.property.name='error']"(
        node: any
      ) {
        context.report({
          node,
          messageId: "consoleErrorInApiRoute",
        });
      },

      // Check for handleApiError usage without context
      "CallExpression[callee.name='handleApiError']"(node: any) {
        // Allow if it's being migrated, but warn
        if (node.arguments.length < MIN_HANDLE_API_ERROR_ARGS) {
          context.report({
            node,
            messageId: "bareHandleApiError",
          });
        }
      },

      // Check catch blocks
      CatchClause(node: any) {
        checkCatchClause(
          node,
          context,
          hasErrorHandlerImport,
          hasWithErrorHandlerImport
        );
      },
    };
  },
};

function checkCatchClause(
  node: any,
  context: Rule.RuleContext,
  hasErrorHandlerImport: boolean,
  hasWithErrorHandlerImport: boolean
): void {
  const catchBody = node.body.body;
  if (catchBody.length === EMPTY_CATCH_BODY_LENGTH) {
    return;
  }

  const errorHandlerCall = findErrorHandlingCall(catchBody);
  const hasProperErrorHandling = Boolean(errorHandlerCall);

  if (errorHandlerCall) {
    verifyErrorContext(errorHandlerCall, context);
  }

  if (
    !hasProperErrorHandling &&
    !hasErrorHandlerImport &&
    !hasWithErrorHandlerImport &&
    !usesHandleApiError(catchBody)
  ) {
    context.report({
      node,
      messageId: "missingErrorHandler",
    });
  }
}

function findErrorHandlingCall(catchBody: any[]): any | null {
  for (const statement of catchBody) {
    if (statement.type !== "ReturnStatement") {
      continue;
    }
    const returnArg = statement.argument;
    if (
      returnArg &&
      returnArg.type === "CallExpression" &&
      returnArg.callee.type === "Identifier"
    ) {
      const calleeName = returnArg.callee.name;
      if (calleeName.startsWith("log") && calleeName.includes("Error")) {
        return returnArg;
      }
    }
  }
  return null;
}

function verifyErrorContext(callExpression: any, context: Rule.RuleContext): void {
  if (callExpression.arguments.length < MIN_ERROR_HANDLER_OPTIONS_ARGS) {
    return;
  }
  const optionsArg = callExpression.arguments[1];
  if (!optionsArg || optionsArg.type !== "ObjectExpression") {
    return;
  }
  const props = optionsArg.properties;
  const hasAction = props.some(
    (p: any) =>
      p.type === "Property" &&
      p.key.type === "Identifier" &&
      p.key.name === "action"
  );
  const hasContext = props.some(
    (p: any) =>
      p.type === "Property" &&
      p.key.type === "Identifier" &&
      p.key.name === "context"
  );
  const hasFallbackMessage = props.some(
    (p: any) =>
      p.type === "Property" &&
      p.key.type === "Identifier" &&
      p.key.name === "fallbackMessage"
  );
  if (!hasAction || !hasContext || !hasFallbackMessage) {
    context.report({
      node: callExpression,
      messageId: "missingErrorContext",
    });
  }
}

function usesHandleApiError(catchBody: any[]): boolean {
  return catchBody.some((statement) => {
    if (statement.type !== "ReturnStatement") {
      return false;
    }
    const returnArg = statement.argument;
    return (
      returnArg &&
      returnArg.type === "CallExpression" &&
      returnArg.callee.type === "Identifier" &&
      returnArg.callee.name === "handleApiError"
    );
  });
}

export default rule;
