/**
 * Rule: require-test-exercises-route
 *
 * Ensures that API route test files actually call the route handler,
 * not just import it. Tests that import without calling are meaningless.
 *
 * Blocked:
 *   // Just imports, no call
 *   import { GET } from './route';
 *   it('should exist', () => { expect(GET).toBeDefined(); });
 *
 * Allowed:
 *   import { GET } from './route';
 *   it('should return data', async () => {
 *     const response = await GET(mockRequest);
 *     expect(response.status).toBe(200);
 *   });
 *
 * ADR: ADR-002-governance-schema
 */

import type { Rule } from "eslint";
import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

/**
 * Find project root by walking up until package.json is found
 */
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

/**
 * Extract HTTP methods exported from a route file
 */
function getRouteExportedMethods(routePath: string): string[] {
  if (!existsSync(routePath)) {
    return [];
  }

  try {
    const content = readFileSync(routePath, "utf-8");
    const methods: string[] = [];

    for (const method of HTTP_METHODS) {
      // Check for: export const GET, export async function GET, export { GET }
      const patterns = [
        new RegExp(`export\\s+const\\s+${method}\\b`),
        new RegExp(`export\\s+async\\s+function\\s+${method}\\b`),
        new RegExp(`export\\s+function\\s+${method}\\b`),
        new RegExp(`export\\s*\\{[^}]*\\b${method}\\b[^}]*\\}`),
      ];

      if (patterns.some((p) => p.test(content))) {
        methods.push(method);
      }
    }

    return methods;
  } catch {
    return [];
  }
}

/**
 * Check if test references the route
 */
function checkRouteReference(fullText: string, apiPath: string): boolean {
  const routePatterns = [
    new RegExp(
      `from\\s+["'].*${apiPath.replace(/\[/g, "\\[").replace(/\]/g, "\\]")}.*["']`
    ),
    new RegExp(
      `/api/${apiPath.replace(/\[/g, "\\[").replace(/\]/g, "\\]").replace(/\[(\w+)\]/g, "[^/]+")}`
    ),
    /route\.ts/,
  ];
  return routePatterns.some((p) => p.test(fullText));
}

/**
 * Check for HTTP request patterns in text
 */
function checkRequestPatterns(fullText: string): boolean {
  const requestPatterns = [
    /\bfetch\s*\(/,
    /\brequest\s*\(/,
    /\.get\s*\(/i,
    /\.post\s*\(/i,
    /\.put\s*\(/i,
    /\.patch\s*\(/i,
    /\.delete\s*\(/i,
    /\bGET\s*\(/,
    /\bPOST\s*\(/,
    /\bPUT\s*\(/,
    /\bPATCH\s*\(/,
    /\bDELETE\s*\(/,
    /NextRequest/,
    /createMockRequest/,
    /mockRequest/i,
  ];
  return requestPatterns.some((p) => p.test(fullText));
}

/**
 * Count test blocks and skipped tests
 */
function countTestBlocks(fullText: string): { activeTests: number } {
  const testBlockPattern = /\b(it|test)\s*\(\s*["'`][^"'`]+["'`]\s*,/g;
  const testBlocks = fullText.match(testBlockPattern) || [];

  const stubPatterns = [
    /it\.skip\s*\(/g,
    /test\.skip\s*\(/g,
    /it\.todo\s*\(/g,
    /test\.todo\s*\(/g,
  ];
  const skippedTests = stubPatterns.reduce((count, pattern) => {
    const matches = fullText.match(pattern);
    return count + (matches ? matches.length : 0);
  }, 0);

  return { activeTests: testBlocks.length - skippedTests };
}

interface ReportParams {
  context: Rule.RuleContext;
  node: any;
  apiPath: string;
  hasRouteReference: boolean;
  hasRequestCalls: boolean;
  requestCallsTotal: number;
  requestCallsInsideTests: number;
  activeTests: number;
}

/**
 * Report route-related issues
 */
function reportRouteIssues(params: ReportParams): void {
  const {
    context,
    node,
    apiPath,
    hasRouteReference,
    hasRequestCalls,
    requestCallsTotal,
    requestCallsInsideTests,
    activeTests,
  } = params;

  if (!hasRouteReference) {
    context.report({
      node,
      loc: { line: 1, column: 0 },
      messageId: "noRouteReference",
      data: { routePath: `app/api/${apiPath}/route.ts` },
    });
  }

  if (!hasRequestCalls) {
    context.report({
      node,
      loc: { line: 1, column: 0 },
      messageId: "noRequestCalls",
    });
  } else if (requestCallsTotal > 0 && requestCallsInsideTests === 0) {
    context.report({
      node,
      loc: { line: 1, column: 0 },
      messageId: "requestCallsOutsideTests",
    });
  }

  if (activeTests === 0) {
    context.report({
      node,
      loc: { line: 1, column: 0 },
      messageId: "stubTestFile",
    });
  }
}

/**
 * Check if tests cover all exported HTTP methods with actual HTTP calls
 */
function checkMethodCoverage(
  context: Rule.RuleContext,
  node: any,
  routePath: string,
  fullText: string
): void {
  const exportedMethods = getRouteExportedMethods(routePath);

  for (const method of exportedMethods) {
    // Check for actual HTTP call patterns, not just method name mentions
    const httpCallPatterns = [
      // Direct route handler calls: GET(request), POST(request)
      new RegExp(`\\b${method}\\s*\\(`, "i"),
      // fetch with method option: fetch(..., { method: 'GET' })
      new RegExp(`method\\s*:\\s*["'\`]${method}["'\`]`, "i"),
      // Supertest-style: .get(...), .post(...)
      new RegExp(`\\.${method.toLowerCase()}\\s*\\(`),
      // NextRequest with method: new NextRequest(..., { method: 'GET' })
      new RegExp(
        `NextRequest\\s*\\([^)]*method\\s*:\\s*["'\`]${method}["'\`]`
      ),
      // createMockRequest with method
      new RegExp(
        `createMockRequest\\s*\\([^)]*method\\s*:\\s*["'\`]${method}["'\`]`
      ),
      // Request constructor with method
      new RegExp(
        `new\\s+Request\\s*\\([^)]*method\\s*:\\s*["'\`]${method}["'\`]`
      ),
    ];

    const hasActualHttpCall = httpCallPatterns.some((p) => p.test(fullText));

    // Also check for method mention in test description (weaker signal)
    const mentionPatterns = [new RegExp(`["'\`].*\\b${method}\\b.*["'\`]`, "i")];
    const hasMention = mentionPatterns.some((p) => p.test(fullText));

    if (!hasActualHttpCall) {
      if (hasMention) {
        // Method is mentioned but no actual call found
        context.report({
          node,
          loc: { line: 1, column: 0 },
          messageId: "methodMentionedButNotCalled",
          data: { method },
        });
      } else {
        // Method not tested at all
        context.report({
          node,
          loc: { line: 1, column: 0 },
          messageId: "missingMethodTest",
          data: { method },
        });
      }
    }
  }
}

interface ValidateParams {
  context: Rule.RuleContext;
  filename: string;
  projectRoot: string;
  requireAllMethods: boolean;
  requestCallsTotal: number;
  requestCallsInsideTests: number;
  programNode: any;
}

/**
 * Validate route test file on program exit
 */
function validateRouteTestFile(params: ValidateParams): void {
  const {
    context,
    filename,
    projectRoot,
    requireAllMethods,
    requestCallsTotal,
    requestCallsInsideTests,
    programNode,
  } = params;

  const sourceCode = context.sourceCode || context.getSourceCode();
  const fullText = sourceCode.getText();
  const node = programNode;

  // Determine the route path this test should be testing
  const testPathMatch = filename.match(
    /__tests__\/api\/(.+)\/route\.(?:contract\.)?test\.tsx?$/
  );

  if (!testPathMatch) {
    return;
  }

  const apiPath = testPathMatch[1];
  const routePath = join(projectRoot, "app/api", apiPath, "route.ts");

  // Check route reference and request patterns
  const hasRouteReference = checkRouteReference(fullText, apiPath);
  const hasRequestCalls = checkRequestPatterns(fullText);
  const { activeTests } = countTestBlocks(fullText);

  // Report issues
  reportRouteIssues({
    context,
    node,
    apiPath,
    hasRouteReference,
    hasRequestCalls,
    requestCallsTotal,
    requestCallsInsideTests,
    activeTests,
  });

  // Check method coverage
  if (activeTests > 0 && requireAllMethods && existsSync(routePath)) {
    checkMethodCoverage(context, node, routePath, fullText);
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Validate that API route test files actually exercise the routes they test",
      category: "Test Quality",
      recommended: true,
    },
    messages: {
      noRouteReference:
        "Test file should reference the route it's testing. " +
        "Import from '{{routePath}}' or use fetch/request to the endpoint.",
      missingMethodTest:
        "Route exports {{method}} but test file has no tests for it. " +
        "Add test cases for {{method}} requests.",
      noRequestCalls:
        "Test file has no HTTP request calls (fetch, request, GET, POST, etc.). " +
        "API route tests should make actual requests.",
      requestCallsOutsideTests:
        "HTTP request calls found but not inside test blocks (it/test). " +
        "Move request calls inside test functions to actually exercise the route.",
      stubTestFile:
        "Test file appears to be a stub with no meaningful test logic. " +
        "Add actual test cases that exercise the route.",
      methodMentionedButNotCalled:
        "Route exports {{method}} which is mentioned in test descriptions but no actual HTTP call found. " +
        "Add actual {{method}} requests using fetch(), route handler calls, or mock requests.",
    },
    schema: [
      {
        type: "object",
        properties: {
          requireAllMethods: {
            type: "boolean",
            default: true,
            description: "Require tests for all exported HTTP methods",
          },
          minTestsPerMethod: {
            type: "integer",
            minimum: 1,
            default: 1,
            description: "Minimum test cases per HTTP method",
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const options = context.options[0] || {};
    const requireAllMethods = options.requireAllMethods !== false;

    // Only check API route test files
    const isApiRouteTest =
      filename.includes("__tests__/api/") &&
      (filename.endsWith(".test.ts") || filename.endsWith(".test.tsx"));

    if (!isApiRouteTest) {
      return {};
    }

    const projectRoot = findProjectRoot(dirname(filename));

    // Track if we're inside a test block for AST analysis
    let insideTestBlock = false;
    let requestCallsInsideTests = 0;
    let requestCallsTotal = 0;

    return {
      // Track entering test blocks
      CallExpression(node: any) {
        // Check if this is a test block (it, test, describe)
        if (
          node.callee.type === "Identifier" &&
          (node.callee.name === "it" || node.callee.name === "test")
        ) {
          insideTestBlock = true;
        }

        // Check for request calls
        const isRequestCall =
          (node.callee.type === "Identifier" &&
            (node.callee.name === "fetch" ||
              node.callee.name === "GET" ||
              node.callee.name === "POST" ||
              node.callee.name === "PUT" ||
              node.callee.name === "PATCH" ||
              node.callee.name === "DELETE")) ||
          (node.callee.type === "MemberExpression" &&
            node.callee.property.type === "Identifier" &&
            ["get", "post", "put", "patch", "delete", "request"].includes(
              node.callee.property.name.toLowerCase()
            ));

        if (isRequestCall) {
          requestCallsTotal++;
          if (insideTestBlock) {
            requestCallsInsideTests++;
          }
        }
      },

      "CallExpression:exit"(node: any) {
        // Track exiting test blocks
        if (
          node.callee.type === "Identifier" &&
          (node.callee.name === "it" || node.callee.name === "test")
        ) {
          insideTestBlock = false;
        }
      },

      "Program:exit"(programNode: any) {
        validateRouteTestFile({
          context,
          filename,
          projectRoot,
          requireAllMethods,
          requestCallsTotal,
          requestCallsInsideTests,
          programNode,
        });
      },
    };
  },
};

export default rule;
