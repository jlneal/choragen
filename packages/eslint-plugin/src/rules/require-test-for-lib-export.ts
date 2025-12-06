/**
 * Rule: require-test-for-lib-export
 *
 * Ensures that lib module exports have corresponding test files,
 * enforcing test coverage for library code.
 *
 * For: lib/activities/activityService.ts
 * Expects: lib/__tests__/activities/activityService.test.ts (or similar)
 *
 * ADR: ADR-002-governance-schema
 */

import type { Rule } from "eslint";
import { existsSync } from "fs";
import { basename, dirname, join, relative } from "path";

const LIB_DIR = "lib/";
const TEST_EXTENSIONS = [".test.ts", ".test.tsx"];

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
      description: "Require test files for lib module exports",
      category: "Best Practices",
      recommended: false,
    },
    messages: {
      missingTest:
        "Lib module with exports must have a corresponding test file. Expected: {{expectedPath}}",
    },
    schema: [
      {
        type: "object",
        properties: {
          exemptPatterns: {
            type: "array",
            description: "File patterns exempt from test requirements",
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
    const exemptPatterns = options.exemptPatterns || [];

    // Only check files in lib/ directory
    if (!filename.includes(`/${LIB_DIR}`)) {
      return {};
    }

    // Skip test files themselves
    if (
      filename.includes("__tests__") ||
      TEST_EXTENSIONS.some((ext) => filename.endsWith(ext))
    ) {
      return {};
    }

    // Skip index/barrel files (they just re-export)
    if (filename.endsWith("/index.ts") || filename.endsWith("/index.tsx")) {
      return {};
    }

    // Skip type definition files
    if (
      filename.endsWith(".d.ts") ||
      filename.endsWith("/types.ts") ||
      filename.includes("/types/")
    ) {
      return {};
    }

    // Check exempt patterns
    const isExempt = exemptPatterns.some((pattern: string) =>
      filename.includes(pattern)
    );
    if (isExempt) {
      return {};
    }

    // Track if file has exports
    let hasExports = false;

    return {
      ExportNamedDeclaration() {
        hasExports = true;
      },
      ExportDefaultDeclaration() {
        hasExports = true;
      },

      "Program:exit"(node) {
        if (!hasExports) {
          return;
        }

        const fileDir = dirname(filename);
        const fileBasename = basename(filename).replace(/\.(ts|tsx)$/, "");

        // Find project root
        const projectRoot = findProjectRoot(fileDir);

        // Extract the path relative to lib/
        const libIndex = filename.indexOf(`/${LIB_DIR}`);
        const relativePath = filename.slice(libIndex + LIB_DIR.length + 1);
        const relativeDir = dirname(relativePath);

        // Check for test file in various locations
        const possibleTestPaths = [
          // lib/__tests__/activities/activityService.test.ts
          join(
            projectRoot,
            "lib",
            "__tests__",
            relativeDir,
            `${fileBasename}.test.ts`
          ),
          // lib/__tests__/activityService.test.ts (flat structure)
          join(projectRoot, "lib", "__tests__", `${fileBasename}.test.ts`),
          // lib/activities/__tests__/activityService.test.ts
          join(fileDir, "__tests__", `${fileBasename}.test.ts`),
          // lib/activities/activityService.test.ts (co-located)
          join(fileDir, `${fileBasename}.test.ts`),
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
