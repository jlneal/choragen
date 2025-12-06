/**
 * Rule: no-magic-numbers-http
 *
 * Disallows magic numbers for HTTP status codes.
 * Use the HttpStatus enum from @choragen/contracts instead.
 *
 * Blocked:
 *   return new Response(null, { status: 404 });
 *   expect(response.status).toBe(200);
 *
 * Allowed:
 *   return new Response(null, { status: HttpStatus.NOT_FOUND });
 *   expect(response.status).toBe(HttpStatus.OK);
 *
 * ADR: ADR-002-governance-schema (code hygiene enforcement)
 */

import type { Rule } from "eslint";

// Common HTTP status codes that should use HttpStatus enum
const HTTP_STATUS_CODES = new Set([
  100, 101, 102, 103, // 1xx Informational
  200, 201, 202, 203, 204, 205, 206, 207, 208, 226, // 2xx Success
  300, 301, 302, 303, 304, 305, 307, 308, // 3xx Redirection
  400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451, // 4xx Client Error
  500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511, // 5xx Server Error
]);

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow magic numbers for HTTP status codes",
      category: "Code Hygiene",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          ignore: {
            type: "array",
            items: { type: "number" },
            description: "Status codes to ignore",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      usedMagicNumber:
        "Use HttpStatus.{{name}} instead of magic number {{value}}. Import from '@choragen/contracts'.",
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const ignore = new Set(options.ignore || []);

    // Map status codes to enum names
    const statusNames: Record<number, string> = {
      200: "OK",
      201: "CREATED",
      204: "NO_CONTENT",
      301: "MOVED_PERMANENTLY",
      302: "FOUND",
      304: "NOT_MODIFIED",
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      405: "METHOD_NOT_ALLOWED",
      409: "CONFLICT",
      410: "GONE",
      422: "UNPROCESSABLE_ENTITY",
      429: "TOO_MANY_REQUESTS",
      500: "INTERNAL_SERVER_ERROR",
      501: "NOT_IMPLEMENTED",
      502: "BAD_GATEWAY",
      503: "SERVICE_UNAVAILABLE",
    };

    return {
      Literal(node: any) {
        if (typeof node.value !== "number") return;
        if (!HTTP_STATUS_CODES.has(node.value)) return;
        if (ignore.has(node.value)) return;

        // Check if it's in a context that looks like HTTP status usage
        const parent = node.parent;
        if (!parent) return;

        // Check for: { status: 404 }
        const isStatusProperty =
          parent.type === "Property" &&
          parent.key.type === "Identifier" &&
          parent.key.name === "status";

        // Check for: .toBe(404), .toEqual(404)
        const isTestAssertion =
          parent.type === "CallExpression" &&
          parent.callee.type === "MemberExpression" &&
          parent.callee.property.type === "Identifier" &&
          ["toBe", "toEqual", "toStrictEqual"].includes(
            parent.callee.property.name
          );

        // Check for: new Response(null, { status: 404 })
        const isResponseStatus =
          parent.type === "Property" &&
          parent.parent?.type === "ObjectExpression" &&
          parent.parent?.parent?.type === "NewExpression";

        if (isStatusProperty || isTestAssertion || isResponseStatus) {
          const name = statusNames[node.value] || `STATUS_${node.value}`;
          context.report({
            node,
            messageId: "usedMagicNumber",
            data: { name, value: String(node.value) },
          });
        }
      },
    };
  },
};

export default rule;
