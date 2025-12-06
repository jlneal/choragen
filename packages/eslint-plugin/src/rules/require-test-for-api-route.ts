/**
 * Rule: require-test-for-api-route
 *
 * Ensures that every API route file has a corresponding test file,
 * enforcing test-first development for critical paths.
 *
 * For: app/api/trips/[tripId]/route.ts
 * Expects: __tests__/api/trips/[tripId]/route.test.ts (or similar)
 *
 * ADR: ADR-002-governance-schema
 */

import type { Rule } from "eslint";
import { existsSync } from "fs";
import { dirname, join, relative } from "path";

const ROUTE_FILENAME = "route.ts";

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

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require test files for API route handlers",
      category: "Best Practices",
      recommended: false,
    },
    messages: {
      missingTest:
        "API route must have a corresponding test file. Expected: {{expectedPath}}",
    },
    schema: [
      {
        type: "object",
        properties: {
          testDirectory: {
            type: "string",
            default: "__tests__",
            description: "Root directory for test files",
          },
          exemptPaths: {
            type: "array",
            description:
              "API route path prefixes (relative to app/api) that are exempt from test requirements",
            items: { type: "string" },
            default: [],
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const options = context.options[0] || {};
    const testDirectory = options.testDirectory || "__tests__";
    const exemptPaths = options.exemptPaths || [];

    // Only check API route files
    if (
      !filename.includes("/app/api/") ||
      !filename.endsWith(ROUTE_FILENAME)
    ) {
      return {};
    }

    // Skip test files themselves
    if (filename.includes("__tests__") || filename.includes(".test.")) {
      return {};
    }

    return {
      Program(node) {
        // Extract the API path relative to app/api/
        const apiMatch = filename.match(/\/app\/api\/(.+)\/route\.ts$/);
        if (!apiMatch) {
          return;
        }

        const apiPath = apiMatch[1];

        const isExempt = exemptPaths.some(
          (exemptPath: string) =>
            apiPath === exemptPath || apiPath.startsWith(`${exemptPath}/`)
        );

        if (isExempt) {
          return;
        }

        // Find project root (walk up until we find package.json)
        const projectRoot = findProjectRoot(dirname(filename));

        // Check for test file in various locations
        const possibleTestPaths = [
          // __tests__/api/trips/[tripId]/route.test.ts
          join(projectRoot, testDirectory, "api", apiPath, "route.test.ts"),
          // __tests__/api/trips/[tripId]/route.contract.test.ts
          join(
            projectRoot,
            testDirectory,
            "api",
            apiPath,
            "route.contract.test.ts"
          ),
          // app/api/trips/[tripId]/__tests__/route.test.ts
          join(dirname(filename), "__tests__", "route.test.ts"),
          // app/api/trips/[tripId]/route.test.ts (co-located)
          filename.replace(".ts", ".test.ts"),
        ];

        const hasTest = possibleTestPaths.some((testPath) =>
          existsSync(testPath)
        );

        if (!hasTest) {
          const expectedPath = relative(projectRoot, possibleTestPaths[0]);
          context.report({
            node,
            loc: { line: 1, column: 0 },
            messageId: "missingTest",
            data: { expectedPath },
          });
        }
      },
    };
  },
};

export default rule;
